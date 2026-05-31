// ============================================================
//  Supabase 数据层 - 替代 localStorage
// ============================================================
// 使用前需要在 LLM 设置面板中填入 Supabase URL 和 Anon Key

let supabaseClient = null;
let _supabaseReady = false;

// 从 localStorage 读取持久化的 Supabase 配置
const _savedUrl = localStorage.getItem("liuyao-supabase-url") || "";
const _savedKey = localStorage.getItem("liuyao-supabase-key") || "";

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  const url = localStorage.getItem("liuyao-supabase-url") || "";
  const key = localStorage.getItem("liuyao-supabase-key") || "";
  if (!url || !key) return null;
  try {
    supabaseClient = supabase.createClient(url, key);
    _supabaseReady = true;
    return supabaseClient;
  } catch (e) {
    console.error("Supabase 初始化失败:", e);
    return null;
  }
}

// ── 匿名登录（自动管理会话） ──
let _sbUser = null;

async function ensureSession() {
  const sb = getSupabaseClient();
  if (!sb) return null;

  // 尝试恢复已有会话
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) {
    _sbUser = session.user;
    return _sbUser;
  }

  // 匿名登录
  const { data, error } = await sb.auth.signInAnonymously();
  if (error) {
    console.warn("Supabase 匿名登录失败:", error.message);
    return null;
  }
  _sbUser = data.user;
  return _sbUser;
}

// ── 数据表名 ──
const TABLE_HISTORY = "liuyao_history";

// ── 创建表（如果不存在） ──
async function ensureTable() {
  // Supabase 需要用户在 Dashboard 手动建表，这里只是检查连接
  return true;
}

// ── 保存 Supabase 配置 ──
function saveSupabaseConfig() {
  const url = document.getElementById("supabaseUrl").value.trim();
  const key = document.getElementById("supabaseKey").value.trim();
  const status = document.getElementById("supabaseStatus");

  if (!url || !key) {
    status.textContent = "请输入 URL 和 Key";
    status.style.color = "#f78166";
    return;
  }

  localStorage.setItem("liuyao-supabase-url", url);
  localStorage.setItem("liuyao-supabase-key", key);

  supabaseClient = null;
  _supabaseReady = false;

  status.textContent = "连接中…";
  status.style.color = "#8b949e";

  ensureSession().then(user => {
    if (user) {
      status.textContent = "✅ 已连接";
      status.style.color = "#3fb950";
      if (typeof loadHistory === 'function') loadHistory();
    } else {
      status.textContent = "❌ 连接失败，请检查配置";
      status.style.color = "#f78166";
    }
  });
}

// ── 自动加载已保存的配置 ──
document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("supabaseUrl");
  const keyInput = document.getElementById("supabaseKey");
  if (urlInput) urlInput.value = localStorage.getItem("liuyao-supabase-url") || "";
  if (keyInput) keyInput.value = localStorage.getItem("liuyao-supabase-key") || "";
  if (urlInput?.value && keyInput?.value) {
    setTimeout(() => saveSupabaseConfig(), 500);
  }
});

// ── 保存占卜记录 ──
async function sbSaveHistory(result) {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const user = await ensureSession();
  if (!user) return false;

  const record = {
    user_id: user.id,
    hexagram_data: result,
    llm_content: result._llmContent || null,
    llm_messages: result._llmMessages || null,
    cast_count: result._castCount || 1,
    created_at: new Date().toISOString()
  };

  const { data, error } = await sb
    .from(TABLE_HISTORY)
    .insert(record)
    .select()
    .single();

  if (error) {
    console.error("Supabase 保存失败:", error.message);
    return false;
  }

  // 将服务器返回的 id 存回本地
  if (data) {
    result._sbId = data.id;
  }
  return true;
}

// ── 加载某用户的所有占卜记录 ──
async function sbLoadHistory() {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const user = await ensureSession();
  if (!user) return [];

  // 先从本地加载
  let localHistory = [];
  try {
    const saved = localStorage.getItem("liuyao-history");
    if (saved) localHistory = JSON.parse(saved);
  } catch(e) {}
  if (!Array.isArray(localHistory)) localHistory = [];

  const { data, error } = await sb
    .from(TABLE_HISTORY)
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Supabase 加载失败:", error.message);
    return localHistory;
  }

  // 合并：以服务器数据为主，补上本地尚未同步的记录
  const serverMap = new Map();
  const seenSbIds = new Set();

  for (const row of data) {
    seenSbIds.add(row.id);
    serverMap.set(row.id, {
      ...row.hexagram_data,
      _sbId: row.id,
      _sbSynced: true,
      _llmContent: row.llm_content,
      _llmMessages: row.llm_messages
    });
  }

  // 添加本地有但服务器没有的记录
  for (const item of localHistory) {
    if (item._sbId && seenSbIds.has(item._sbId)) continue;
    // 尝试将本地未同步的记录推送到服务器
    const saved = await sbSaveHistory(item);
    if (saved) {
      serverMap.set(item._sbId || Date.now(), {
        ...item,
        _sbSynced: true
      });
    } else {
      serverMap.set("local_" + Date.now() + Math.random(), item);
    }
  }

  const merged = Array.from(serverMap.values());
  // 按时间倒序
  merged.sort((a, b) => {
    const da = a.timestamp || a.created_at || 0;
    const db = b.timestamp || b.created_at || 0;
    return db - da;
  });

  return merged;
}

// ── 更新占卜记录的 LLM 内容 ──
async function sbUpdateLLM(sbId, llmContent, llmMessages) {
  const sb = getSupabaseClient();
  if (!sb || !sbId) return false;

  const { error } = await sb
    .from(TABLE_HISTORY)
    .update({ llm_content: llmContent, llm_messages: llmMessages })
    .eq("id", sbId);

  if (error) {
    console.error("Supabase 更新 LLM 失败:", error.message);
    return false;
  }
  return true;
}

// ── 清空当前用户的所有记录 ──
async function sbClearHistory() {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const user = await ensureSession();
  if (!user) return false;

  const { error } = await sb
    .from(TABLE_HISTORY)
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("Supabase 清空失败:", error.message);
    return false;
  }
  return true;
}
