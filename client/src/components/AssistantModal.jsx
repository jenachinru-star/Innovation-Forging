import { useEffect, useRef, useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Download,
  Check,
  Loader2,
  Wand2,
  Palette,
  LayoutGrid,
  Lightbulb,
} from 'lucide-react';
import { chatAssistant } from '../api/assistant.js';
import { ASSET_STATUS } from '@director/shared/constants/status.js';
import { nextId } from '../store/plan.js';

// ===== 右侧 4 个增强面板的选项 =====
const IMAGE_TYPES = [
  { value: '灯光效果图', label: '灯光效果图' },
  { value: '舞美置景', label: '舞美置景' },
  { value: '人物造型', label: '人物造型' },
  { value: '分镜', label: '分镜' },
  { value: '找参考', label: '找参考' },
];

const RATIOS = [
  { value: '横图（1792x1024）', label: '横图' },
  { value: '竖图（1024x1792）', label: '竖图' },
  { value: '方图（1024x1024）', label: '方图' },
];

const STYLES = ['暖棕金电影感', '写实', '油画', '水墨', '复古胶片', '极简'];

const COMPOSITIONS = ['聚光居中', '对称构图', '三分法', '俯视', '仰视', '走位示意'];

const LIGHT_GROUPS = [
  { key: 'colorTemp', label: '色温', options: ['暖色温', '中性色温', '冷色温'] },
  { key: 'contrast', label: '光比', options: ['低反差柔光', '高反差硬光'] },
  { key: 'lightPos', label: '光位', options: ['顺光', '侧光', '逆光', '顶光'] },
  { key: 'lightQuality', label: '光质', options: ['聚光', '散射光'] },
  { key: 'brightness', label: '明暗', options: ['暗调', '标准曝光', '高亮'] },
];

const SUGGESTIONS = [
  '帮我设计第一场的暖光氛围',
  '找一个类似雨夜窗边的灯光参考',
  '人物独白时应该怎么打光？',
];

const EMPTY_ENHANCE = {
  imageType: '',
  ratio: '',
  style: '',
  composition: '',
  colorTemp: '',
  contrast: '',
  lightPos: '',
  lightQuality: '',
  brightness: '',
};

function makeMessage(role, content, extra = {}) {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    images: [],
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

// 把结构化面板参数转成自然语言，附加到最后一条用户消息，引导模型在生图时采用
function buildEnhanceText(enhance) {
  const parts = [];
  if (enhance.imageType) parts.push(`生图类型为「${enhance.imageType}」`);
  if (enhance.ratio) parts.push(`画幅为${enhance.ratio}`);
  if (enhance.style) parts.push(`风格为「${enhance.style}」`);
  if (enhance.composition) parts.push(`构图采用「${enhance.composition}」`);
  const lightParts = LIGHT_GROUPS.map((g) => enhance[g.key]).filter(Boolean);
  if (lightParts.length) parts.push(`光影要求：${lightParts.join('、')}`);
  if (!parts.length) return '';
  return `\n[生图参数参考，请在调用 generate_image 时严格采用] ${parts.join('；')}`;
}

export default function AssistantModal({ open, onClose, plan, dispatch, context }) {
  const stored = Array.isArray(plan?.assistantMessages) ? plan.assistantMessages : [];
  const [messages, setMessages] = useState(stored);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [enhance, setEnhance] = useState(EMPTY_ENHANCE);
  const [savedUrls, setSavedUrls] = useState(() => new Set());
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open) {
      setMessages(Array.isArray(plan?.assistantMessages) ? plan.assistantMessages : []);
    }
  }, [open, plan?.assistantMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function persistMessages(next) {
    setMessages(next);
    dispatch({ type: 'setAssistantMessages', messages: next });
  }

  function toggleChip(key, value) {
    setEnhance((prev) => ({ ...prev, [key]: prev[key] === value ? '' : value }));
  }

  async function handleSend(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const userMsg = makeMessage('user', content);
    const next = [...messages, userMsg];
    persistMessages(next);
    setInput('');
    setLoading(true);
    try {
      const suffix = buildEnhanceText(enhance);
      const historyForApi = next.map((m, i) =>
        i === next.length - 1
          ? { role: m.role, content: m.content + suffix }
          : { role: m.role, content: m.content }
      );
      const data = await chatAssistant(historyForApi, context);
      const aiMsg = makeMessage('assistant', data.content || '已为你生成参考图：', {
        images: data.images || [],
      });
      persistMessages([...next, aiMsg]);
    } catch (e) {
      const errMsg = makeMessage('assistant', `出错了：${e.message || '请稍后再试'}`, {
        isError: true,
      });
      persistMessages([...next, errMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleUseImage(image) {
    const asset = {
      id: nextId('asset', plan?.assets),
      type: 'image',
      title: image.prompt.slice(0, 12),
      status: ASSET_STATUS.SELECTED,
      url: image.url,
      source: 'assistant',
      prompt: image.prompt,
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'upsertAsset', asset });
    setSavedUrls((prev) => new Set(prev).add(image.url));
  }

  function handleDownload(image) {
    const anchor = document.createElement('a');
    anchor.href = image.url;
    anchor.download = `ai-reference-${Date.now()}.jpg`;
    anchor.target = '_blank';
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  const hasEnhance = Object.values(enhance).some(Boolean);

  return (
    <div className="assistant-overlay" role="dialog" aria-modal="true" aria-label="AI 助手">
      <div className="assistant-modal">
        <div className="assistant-head">
          <span className="assistant-title">
            <Sparkles size={17} aria-hidden /> AI 助手
          </span>
          <button type="button" className="assistant-close" aria-label="关闭" onClick={onClose}>
            <X size={17} aria-hidden />
          </button>
        </div>

        <div className="assistant-body">
          <div className="assistant-chat" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="assistant-empty">
                <Sparkles size={26} aria-hidden />
                <p>我可以帮你找剧、设计灯光舞美、生成参考图，也能回答排练问题。</p>
                <div className="assistant-suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => handleSend(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`msg-row msg-${m.role}`}>
                <div className={`msg-bubble ${m.isError ? 'is-error' : ''}`}>
                  {m.content && <p className="msg-content">{m.content}</p>}
                  {Array.isArray(m.images) && m.images.length > 0 && (
                    <div className="msg-images">
                      {m.images.map((img) => (
                        <figure key={img.url} className="msg-image-card">
                          <img src={img.url} alt={img.prompt} loading="lazy" />
                          <figcaption>
                            <button type="button" onClick={() => handleUseImage(img)}>
                              {savedUrls.has(img.url) ? (
                                <>
                                  <Check size={13} aria-hidden /> 已存入图片库
                                </>
                              ) : (
                                <>
                                  <Check size={13} aria-hidden /> 使用此图
                                </>
                              )}
                            </button>
                            <button type="button" onClick={() => handleDownload(img)}>
                              <Download size={13} aria-hidden /> 下载
                            </button>
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="msg-row msg-assistant">
                <div className="msg-bubble msg-loading">
                  <Loader2 size={16} className="spin" aria-hidden />
                  <span>正在思考…</span>
                </div>
              </div>
            )}
          </div>

          <aside className="assistant-panels">
            <section className="enhance-panel">
              <h4>
                <Wand2 size={14} aria-hidden /> 生图模式
              </h4>
              <p className="enhance-sub">类型</p>
              <div className="enhance-chips">
                {IMAGE_TYPES.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={enhance.imageType === o.value ? 'is-on' : ''}
                    onClick={() => toggleChip('imageType', o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="enhance-sub">画幅</p>
              <div className="enhance-chips">
                {RATIOS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={enhance.ratio === o.value ? 'is-on' : ''}
                    onClick={() => toggleChip('ratio', o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="enhance-panel">
              <h4>
                <Palette size={14} aria-hidden /> 风格参考
              </h4>
              <div className="enhance-chips">
                {STYLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={enhance.style === s ? 'is-on' : ''}
                    onClick={() => toggleChip('style', s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            <section className="enhance-panel">
              <h4>
                <LayoutGrid size={14} aria-hidden /> 构图助手
              </h4>
              <div className="enhance-chips">
                {COMPOSITIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={enhance.composition === s ? 'is-on' : ''}
                    onClick={() => toggleChip('composition', s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            <section className="enhance-panel">
              <h4>
                <Lightbulb size={14} aria-hidden /> 光影条件
              </h4>
              {LIGHT_GROUPS.map((g) => (
                <div key={g.key}>
                  <p className="enhance-sub">{g.label}</p>
                  <div className="enhance-chips">
                    {g.options.map((o) => (
                      <button
                        key={o}
                        type="button"
                        className={enhance[g.key] === o ? 'is-on' : ''}
                        onClick={() => toggleChip(g.key, o)}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            {hasEnhance && (
              <button
                type="button"
                className="enhance-clear"
                onClick={() => setEnhance(EMPTY_ENHANCE)}
              >
                清空生图参数
              </button>
            )}
          </aside>
        </div>

        <div className="assistant-input">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="输入问题，或描述你想要的画面…"
            aria-label="输入消息"
          />
          <button
            type="button"
            className="assistant-send"
            disabled={!input.trim() || loading}
            onClick={() => handleSend()}
            aria-label="发送"
          >
            <Send size={16} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
