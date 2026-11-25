import { useEffect, useState } from 'react';
import {
  FileText,
  ClipboardCheck,
  Users,
  Clapperboard,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'kaipai.onboarding.done';

const STEPS = [
  {
    icon: FileText,
    title: '准备你的剧本',
    body: '可以直接粘贴文本、上传 Word/PDF，或用 AI 生成一段初稿，三种方式都从这里开始。',
  },
  {
    icon: ClipboardCheck,
    title: '校对与确认',
    body: '系统会标出角色、场景和台词。你可以逐行修改、查找替换，确认无误后再进入制作。',
  },
  {
    icon: Users,
    title: '拆解与排演',
    body: '自动生成场次拆解、人物关系、走位动线和各部门需求，让每个环节都有依据。',
  },
  {
    icon: Clapperboard,
    title: '视觉生成与交付',
    body: '在视觉制作里生成角色、场景、海报和镜头视频，最后一键导出归档，完成整件作品。',
  },
];

export function hasSeenOnboarding() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* 隐私模式等场景下忽略 */
  }
}

export default function OnboardingGuide({ onClose }) {
  const [index, setIndex] = useState(0);
  const current = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const Icon = current.icon;

  function finish() {
    markSeen();
    onClose?.();
  }

  // Esc 等同跳过
  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') finish();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card" role="dialog" aria-modal="true" aria-label="新手指引">
        <button type="button" className="onboarding-close" onClick={finish} aria-label="跳过指引">
          <X size={18} />
        </button>

        <div className="onboarding-progress" aria-hidden="true">
          {STEPS.map((item, i) => (
            <span
              key={item.title}
              className={i === index ? 'is-current' : i < index ? 'is-done' : ''}
            />
          ))}
        </div>

        <div className="onboarding-icon">
          <Icon size={30} />
        </div>
        <p className="onboarding-step-no">
          第 {index + 1} 步 / 共 {STEPS.length} 步
        </p>
        <h3 className="onboarding-title">{current.title}</h3>
        <p className="onboarding-body">{current.body}</p>

        <div className="onboarding-actions">
          <button type="button" className="btn-ghost btn-small" onClick={finish}>
            跳过
          </button>
          <div className="onboarding-nav">
            {index > 0 && (
              <button
                type="button"
                className="btn-ghost btn-small"
                onClick={() => setIndex((i) => i - 1)}
              >
                <ChevronLeft size={15} /> 上一步
              </button>
            )}
            {isLast ? (
              <button type="button" className="btn-seal btn-small" onClick={finish}>
                开始创作
              </button>
            ) : (
              <button
                type="button"
                className="btn-seal btn-small"
                onClick={() => setIndex((i) => i + 1)}
              >
                下一步 <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
