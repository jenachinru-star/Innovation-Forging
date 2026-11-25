import { useState } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';

export function isLink(text) {
  return /^https?:\/\//i.test(String(text || '').trim());
}

export default function CollectionPanel({ plan, dispatch }) {
  const [text, setText] = useState('');
  const collections = Array.isArray(plan?.collections) ? plan.collections : [];

  function add() {
    const value = text.trim();
    if (!value) return;
    dispatch?.({ type: 'addCollection', text: value });
    setText('');
  }

  return (
    <section className="disc-collection" data-testid="collection-panel">
      <h3 className="disc-history-title">
        <Bookmark size={15} /> 资料收藏（{collections.length}）
      </h3>
      <div className="disc-collection-add">
        <input
          className="field"
          value={text}
          aria-label="收藏内容"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') add();
          }}
          placeholder="粘贴链接或输入资料备注，回车收藏"
        />
        <button type="button" className="btn-seal btn-small" onClick={add}>
          收藏
        </button>
      </div>
      {collections.length === 0 ? (
        <p className="disc-empty">还没有收藏，资料链接、参考备注都可存这里。</p>
      ) : (
        <ul className="disc-collection-list">
          {collections.map((item) => (
            <li key={item.id} data-testid={`collection-${item.id}`} className="disc-collection-item">
              {isLink(item.text) ? (
                <a
                  href={item.text}
                  target="_blank"
                  rel="noreferrer"
                  className="disc-collection-link"
                >
                  {item.text}
                </a>
              ) : (
                <span>{item.text}</span>
              )}
              <button
                type="button"
                aria-label="删除收藏"
                className="disc-item-delete"
                onClick={() => dispatch?.({ type: 'removeCollection', id: item.id })}
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
