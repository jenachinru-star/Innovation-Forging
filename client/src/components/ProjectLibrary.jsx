import { useEffect, useMemo, useRef, useState } from 'react';

function formatDate(value) {
  if (!value) return '尚未保存';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '尚未保存';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function ProjectLibrary({
  open,
  projects,
  currentId,
  onClose,
  onCreate,
  onOpen,
  onImport,
  onExport,
  onDelete,
  onDuplicate = () => {},
}) {
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);
  const searchRef = useRef(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = Array.isArray(projects) ? projects : [];
    if (!needle) return list;
    return list.filter((project) =>
      [project.name, project.summary, project.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [projects, query]);

  useEffect(() => {
    if (!open) return undefined;
    searchRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const value = JSON.parse(await file.text());
      const record = value?.project || value;
      if (!record || typeof record !== 'object') throw new Error('文件中没有作品数据');
      // 必须等导入真正完成：服务端会校验归档，失败时不能提示“已导入”
      await onImport(record);
      setMessage(`已导入「${record.name || '未命名作品'}」`);
    } catch (error) {
      setMessage(`导入失败：${String(error?.message || error)}`);
    } finally {
      event.target.value = '';
    }
  }

  return (
    <div className="library-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="library-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="library-head">
          <div>
            <span className="eyebrow">本地作品库</span>
            <h2 id="library-title">继续排演，或开始一件新作品</h2>
          </div>
          <button type="button" className="icon-button" aria-label="关闭作品库" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="library-tools">
          <label className="library-search">
            <span className="visually-hidden">搜索作品</span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索作品名、简介或状态"
            />
          </label>
          <button type="button" className="btn-primary btn-small" onClick={onCreate}>
            新建作品
          </button>
          <button type="button" className="btn-ghost btn-small" onClick={() => fileRef.current?.click()}>
            导入归档
          </button>
          <input
            ref={fileRef}
            className="visually-hidden"
            type="file"
            accept=".json,application/json"
            onChange={handleImport}
          />
        </div>

        {message && <p className="library-message">{message}</p>}

        <div className="library-list" role="list">
          {filtered.length === 0 ? (
            <div className="library-empty">
              <b>还没有匹配的作品</b>
              <p>从一段素材、一份剧本或内置样例开始。</p>
              <button type="button" className="btn-primary" onClick={onCreate}>
                新建第一件作品
              </button>
            </div>
          ) : (
            filtered.map((project) => (
              <article
                key={project.id}
                role="listitem"
                className={`library-project ${project.id === currentId ? 'is-current' : ''}`}
              >
                <button type="button" className="library-project-main" onClick={() => onOpen(project.id)}>
                  <span className="project-monogram" aria-hidden="true">
                    {(project.name || '未').slice(0, 1)}
                  </span>
                  <span className="project-copy">
                    <b>{project.name || '未命名作品'}</b>
                    <span>{project.summary || '舞台制作方案'}</span>
                    <small>
                      {project.sceneCount || 0} 场 · {project.status || '筹备中'} · {formatDate(project.updatedAt)}
                    </small>
                  </span>
                </button>
                <div className="library-project-actions">
                  <button type="button" className="text-action" onClick={() => onDuplicate(project.id)}>
                    复制
                  </button>
                  <button type="button" className="text-action" onClick={() => onExport(project.id)}>
                    导出
                  </button>
                  {project.id !== currentId && (
                    <button type="button" className="text-action is-danger" onClick={() => onDelete(project.id)}>
                      删除
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        <footer className="library-foot">
          作品保存在当前浏览器。完整项目归档可迁移到另一台设备继续编辑。
        </footer>
      </section>
    </div>
  );
}
