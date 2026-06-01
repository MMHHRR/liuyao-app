// ============================================================
//  Supabase 数据层 - 记录所有用户的卜卦数据
// ============================================================

const SUPABASE_URL = "https://eamhymwujnwmqhwdbtoq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhbWh5bXd1am53bXFod2RidG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNDI2MzgsImV4cCI6MjA5NTgxODYzOH0.Grsan2Du59ZEBl1fXPTQPk7BPxvu0rdwIFSl-EPX_W8";

let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
  } catch (e) {
    console.error("Supabase init failed:", e);
    return null;
  }
}

let _sbUser = null;

async function ensureSession() {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) { _sbUser = session.user; return _sbUser; }
  const { data, error } = await sb.auth.signInAnonymously();
  if (error) { console.warn("Supabase anon login failed:", error.message); return null; }
  _sbUser = data.user;
  return _sbUser;
}

const TABLE_HISTORY = "liuyao_history";

async function sbSaveHistory(result) {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const user = await ensureSession();
  if (!user) return false;
  const { data, error } = await sb.from(TABLE_HISTORY).insert({
    user_id: user.id,
    hexagram_data: result,
    method: result._method || null,
    llm_content: result._llmContent || null,
    llm_messages: result._llmMessages || null,
    created_at: new Date().toISOString()
  }).select().single();
  if (error) { console.error("Supabase save failed:", error.message); return false; }
  if (data) result._sbId = data.id;
  return true;
}

async function sbLoadHistory() {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const user = await ensureSession();
  if (!user) return [];
  const { data, error } = await sb.from(TABLE_HISTORY).select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) { console.warn("Supabase load failed:", error.message); return []; }
  return data.map(row => ({ ...row.hexagram_data, _sbId: row.id, _sbSynced: true, _llmContent: row.llm_content, _llmMessages: row.llm_messages, _sbCreatedAt: row.created_at }));
}

async function sbUpdateLLM(sbId, llmContent, llmMessages) {
  const sb = getSupabaseClient();
  if (!sb || !sbId) return false;
  const { error } = await sb.from(TABLE_HISTORY).update({ llm_content: llmContent, llm_messages: llmMessages }).eq("id", sbId);
  if (error) { console.error("Supabase update LLM failed:", error.message); return false; }
  return true;
}

async function sbClearHistory() {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const user = await ensureSession();
  if (!user) return false;
  const { error } = await sb.from(TABLE_HISTORY).delete().eq("user_id", user.id);
  if (error) { console.error("Supabase clear failed:", error.message); return false; }
  return true;
}
