"""
六爻算卦 - Streamlit 应用
支持金钱卦起卦、卦象展示、LLM 智能解读
"""

import streamlit as st
from liuyao_core import (
    cast_hexagram, draw_hexagram, gua_to_text,
    TRIGRAMS, TRIGRAM_ORDER,
)

st.set_page_config(
    page_title="六爻算卦",
    page_icon="☯",
    layout="centered",
    initial_sidebar_state="expanded",
)

# ── 样式 ──
st.markdown("""
<style>
    .gua-box {
        font-family: 'KaiTi', 'STKaiti', 'Noto Serif SC', serif;
        font-size: 1.3rem;
        line-height: 2rem;
        background: #faf6ee;
        padding: 1.5rem 2rem;
        border-radius: 12px;
        border-left: 4px solid #8B4513;
        margin: 1rem 0;
        letter-spacing: 1px;
    }
    .gua-title {
        font-size: 1.6rem;
        font-weight: bold;
        color: #8B0000;
        margin-bottom: 0.5rem;
    }
    .gua-subtitle {
        font-size: 1.1rem;
        color: #5D4037;
        margin-bottom: 1rem;
    }
    .yao-line {
        font-family: 'KaiTi', 'STKaiti', 'Noto Serif SC', serif;
        font-size: 1.5rem;
        line-height: 2.2rem;
    }
    .changing-tag {
        color: #d32f2f;
        font-weight: bold;
    }
    .section-title {
        font-size: 1.2rem;
        font-weight: 600;
        color: #4A148C;
        margin-top: 1.5rem;
        margin-bottom: 0.5rem;
        border-bottom: 2px solid #E1BEE7;
        padding-bottom: 4px;
    }
    .divination-text {
        background: #FFF8E1;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        border: 1px solid #FFE082;
        margin: 0.5rem 0;
        line-height: 1.8;
    }
    .trigram-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin: 0.5rem 0;
    }
    .trigram-item {
        background: #EDE7F6;
        padding: 0.3rem 0.8rem;
        border-radius: 6px;
        font-size: 1.1rem;
    }
    .stButton > button {
        background: #8B0000;
        color: white;
        font-size: 1.2rem;
        padding: 0.5rem 2rem;
        border-radius: 8px;
        border: none;
    }
    .stButton > button:hover {
        background: #a52a2a;
    }
    .highlight {
        background: #FFF3E0;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-weight: 600;
    }
    footer { visibility: hidden; }
</style>
""", unsafe_allow_html=True)


# ── LLM 调用 ──
def call_llm_analysis(result, api_key, api_base, model_name) -> str:
    """调用 LLM 进行卦象解读"""
    import httpx

    gua_text = gua_to_text(result)

    system_prompt = """你是一位精通《周易》的易学大师，同时也是一位善于用现代语言解读卦象的人生导师。

你的任务是根据用户起得的卦象，给出有深度、有温度、实用的解读。

请遵循以下原则：
1. **引用卦辞和爻辞**：结合所起之卦的卦辞、爻辞进行解释。
2. **结合变爻**：如有变爻，请重点分析变爻的爻辞含义，以及本卦到变卦的转化趋势。
3. **三段式结构**：
   - 🎯 **核心卦意**：用一两句话概括本卦的核心信息
   - 🔍 **详细解读**：结合卦象、卦辞、爻辞展开分析（如有变爻重点说明）
   - 💫 **行动建议**：给出具体、可操作的建议
4. **语言风格**：既有古风哲理，又有现代温度。不要过于玄学，要给人以启发。
5. **针对性**：如果用户没有明确问具体问题，就从事业、感情、健康、财运等维度给出综合参考。

请用中文回答，控制在500字以内。"""

    user_prompt = f"""以下是我刚刚起得的卦象信息，请为我详细解读：

{gua_text}

请从事业、感情、健康、财运等角度（如适用）给出综合解读和行动建议。"""

    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.7,
            "max_tokens": 1500,
        }

        with httpx.Client(timeout=60) as client:
            resp = client.post(
                f"{api_base.rstrip('/')}/chat/completions",
                headers=headers,
                json=payload,
            )
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            else:
                return f"⚠️ API 调用失败 (HTTP {resp.status_code})：{resp.text[:200]}"

    except Exception as e:
        return f"""
⚠️ **LLM 连接失败**

未能成功连接大模型，请检查：
- API Base URL 是否正确
- API Key 是否有效
- 网络连接是否正常

错误信息：`{str(e)[:200]}`

💡 **当前显示的仍是传统卦辞解读**，您可以根据上述提示修复配置后重新起卦。
"""


# ── 侧边栏 ──
with st.sidebar:
    st.markdown("## ☯ 六爻算卦")
    st.markdown("---")
    st.markdown("""
    **起卦方法：金钱卦**
    
    用三枚硬币抛六次，从下到上生成六爻。
    
    - **三背** → 老阳 ⚡（变爻）
    - **二背一字** → 少阴
    - **一背二字** → 少阳
    - **三字** → 老阴 ⚡（变爻）
    """)
    st.markdown("---")
    st.markdown("**已起卦次数**")
    if "history_count" not in st.session_state:
        st.session_state.history_count = 0
    st.metric("本局起卦", st.session_state.history_count)

    st.markdown("---")
    st.markdown("### ⚙️ 接入 LLM 解读")
    use_llm = st.toggle("启用 LLM 智能解读", value=True,
                        help="开启后每次起卦会自动调用大模型进行深度解读")
    api_key = st.text_input("API Key（可选）", type="password",
                            help="留空则使用默认配置。支持 OpenAI / DeepSeek 格式的 API Key")
    api_base = st.text_input("API Base URL", value="https://api.deepseek.com",
                             help="OpenAI 兼容接口的 Base URL")
    model_name = st.text_input("模型名称", value="deepseek-chat",
                               help="如 deepseek-chat, gpt-4o, qwen-plus 等")

    st.markdown("---")
    st.caption("v1.0 · 仅供娱乐参考")


# ── 主界面 ──
st.markdown("# 🔮 六爻占卜")
st.markdown('> *\u201c易有太极，是生两仪，两仪生四象，四象生八卦。\u201d*')
st.markdown("---")

# 起卦按钮
col1, col2, col3 = st.columns([1, 2, 1])
with col2:
    cast_btn = st.button("🧮 摇卦", use_container_width=True)

if cast_btn:
    st.session_state.history_count += 1
    result = cast_hexagram()

    # 保存到 session
    st.session_state.last_result = result

    # ── 动画效果（模拟摇卦）──
    with st.spinner("🙏 虔心祷告，三枚硬币起落之间..."):
        import time
        time.sleep(0.8)

    # ═══════════════════════════════════
    # 本卦展示
    # ═══════════════════════════════════
    st.markdown("---")
    st.markdown(f'<div class="gua-title">☰ 本卦：{result.original_keyword}</div>',
                unsafe_allow_html=True)
    st.markdown(f'<div class="gua-subtitle">上 {result.original_upper}（{TRIGRAMS[result.original_upper]["symbol"]}）'
                f' · 下 {result.original_lower}（{TRIGRAMS[result.original_lower]["symbol"]}）</div>',
                unsafe_allow_html=True)

    # 卦象图
    col_a, col_b = st.columns([1, 2])
    with col_a:
        gua_art = draw_hexagram(result)
        st.markdown(f'<div class="gua-box">{gua_art}</div>', unsafe_allow_html=True)

    with col_b:
        st.markdown(f'<div class="section-title">📜 卦辞</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="divination-text"><b>{result.original_tuan}</b></div>',
                    unsafe_allow_html=True)
        st.markdown(f'<div class="section-title">📖 《象》曰</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="divination-text">{result.original_judgment}</div>',
                    unsafe_allow_html=True)
        st.markdown(f'<div class="section-title">💡 解读</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="divination-text">{result.original_description}</div>',
                    unsafe_allow_html=True)

    # 六爻详情
    st.markdown(f'<div class="section-title">🔢 六爻详情</div>', unsafe_allow_html=True)
    pos_names = {0: "初爻", 1: "二爻", 2: "三爻", 3: "四爻", 4: "五爻", 5: "上爻"}
    for i in range(5, -1, -1):
        yao = result.yaos[i]
        line_sym = yao.display()
        yin_yang = "⚊ 阳" if yao.value == 1 else "⚋ 阴"
        change_tag = " ⚡变爻" if yao.changing else ""
        st.markdown(
            f'<div class="yao-line">'
            f'  {line_sym}  <span class="highlight">{pos_names[i]}</span>：{yin_yang}'
            f'  <span style="color:#666;font-size:0.9rem;">（{yao.coin_result}）</span>'
            f'  <span class="changing-tag">{change_tag}</span>'
            f'</div>',
            unsafe_allow_html=True,
        )

    # ═══════════════════════════════════
    # 变卦展示
    # ═══════════════════════════════════
    if result.has_changing():
        st.markdown("---")
        st.markdown(f'<div class="gua-title">🔄 变卦：{result.changed_keyword}</div>',
                    unsafe_allow_html=True)
        st.markdown(f'<div class="gua-subtitle">上 {result.changed_upper}（{TRIGRAMS[result.changed_upper]["symbol"]}）'
                    f' · 下 {result.changed_lower}（{TRIGRAMS[result.changed_lower]["symbol"]}）</div>',
                    unsafe_allow_html=True)

        # 变卦的卦象
        changed_lines_display = []
        for i in range(6):
            yao = result.yaos[i]
            if yao.changing:
                v = yao.changed_value()
                sym = "———" if v == 1 else "— —"
                changed_lines_display.append(f"  {sym}")
            else:
                changed_lines_display.append(f"  {yao.display()}")

        changed_art = "\n".join(
            f"{changed_lines_display[5 - i]}  {pos_names[5 - i]}"
            for i in range(6)
        )

        col_a2, col_b2 = st.columns([1, 2])
        with col_a2:
            st.markdown(f'<div class="gua-box">{changed_art}</div>', unsafe_allow_html=True)
        with col_b2:
            st.markdown(f'<div class="section-title">📜 卦辞</div>', unsafe_allow_html=True)
            st.markdown(f'<div class="divination-text"><b>{result.changed_tuan}</b></div>',
                        unsafe_allow_html=True)
            st.markdown(f'<div class="section-title">📖 《象》曰</div>', unsafe_allow_html=True)
            st.markdown(f'<div class="divination-text">{result.changed_judgment}</div>',
                        unsafe_allow_html=True)
            st.markdown(f'<div class="section-title">💡 解读</div>', unsafe_allow_html=True)
            st.markdown(f'<div class="divination-text">{result.changed_description}</div>',
                        unsafe_allow_html=True)

        st.markdown(
            f"<div style='margin-top:0.5rem;color:#666;font-size:0.9rem;'>"
            f"变爻位置：{'、'.join(pos_names[i] for i in result.changing_lines)}</div>",
            unsafe_allow_html=True,
        )
    else:
        st.info("💤 本卦无变爻，以本卦卦辞为断。静卦主事态平稳，宜静不宜动。")

    # ═══════════════════════════════════
    # LLM 解读
    # ═══════════════════════════════════
    if use_llm:
        st.markdown("---")
        st.markdown(f'<div class="section-title">🤖 LLM 智能解读</div>', unsafe_allow_html=True)

        with st.spinner("🧠 正在请大模型为您解卦..."):
            llm_analysis = call_llm_analysis(result, api_key, api_base, model_name)
        st.markdown(f'<div class="divination-text">{llm_analysis}</div>',
                    unsafe_allow_html=True)

    st.success("✨ 卦象已呈现，愿天地之道助您明心见性。")

elif "last_result" in st.session_state:
    # 显示上次结果
    result = st.session_state.last_result
    st.info("👆 点击上方「摇卦」按钮起新卦，或查看下方的上次结果。")
    # 简略显示上次结果
    st.markdown(f"**上次起卦**：{result.original_keyword}"
                + (f" → {result.changed_keyword}" if result.has_changing() else "（静卦）"))

else:
    # 欢迎界面
    st.markdown("""
    <div style="text-align:center; padding:2rem 0;">
        <div style="font-size:3rem; margin-bottom:1rem;">☯</div>
        <div style="font-size:1.2rem; color:#666;">
            心诚则灵。请点击上方「摇卦」按钮，默念心中所问，<br>
            三枚硬币将为天地代言。
        </div>
        <div style="margin-top:2rem; font-size:0.9rem; color:#999;">
            <i>易为君子谋，卦乃天地心。</i>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # 八卦参考
    with st.expander("📚 八卦参考", expanded=False):
        st.markdown("#### 八卦象征")
        cols = st.columns(4)
        for idx, name in enumerate(TRIGRAM_ORDER):
            info = TRIGRAMS[name]
            with cols[idx % 4]:
                st.markdown(
                    f"**{name}** {info['symbol']}  \n"
                    f"象: {info['nature']}  \n"
                    f"德: {info['attribute']}  \n"
                    f"家人: {info['family']}",
                )
