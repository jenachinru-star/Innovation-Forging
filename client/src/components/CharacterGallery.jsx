import { useState } from 'react';

export default function CharacterGallery({ characters }) {
  const [images, setImages] = useState({});
  const [busyName, setBusyName] = useState('');

  async function generate(c) {
    setBusyName(c.name);
    try {
      const res = await fetch('/api/character/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: c.name, description: c.description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成失败');
      setImages((prev) => ({ ...prev, [c.name]: data.imageUrl }));
    } catch (e) {
      setImages((prev) => ({ ...prev, [c.name]: '' }));
      alert(String(e.message || e));
    } finally {
      setBusyName('');
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {(characters || []).map((c) => (
        <div key={c.name} className="media-area rounded-lg p-3">
          <div
            className="flex h-40 items-center justify-center overflow-hidden rounded"
            style={{ backgroundColor: 'var(--media-raised)' }}
          >
            {images[c.name] ? (
              <img src={images[c.name]} alt={c.name} className="h-full w-full object-cover" />
            ) : (
              <span className="media-muted text-xs">暂无形象</span>
            )}
          </div>
          <p className="font-serif mt-2">{c.name}</p>
          <p className="media-muted line-clamp-2 text-xs">{c.description}</p>
          <button
            onClick={() => generate(c)}
            disabled={busyName === c.name}
            className="btn-media mt-2 w-full py-1 text-xs"
          >
            {busyName === c.name ? '生成中…' : '生成形象'}
          </button>
        </div>
      ))}
    </div>
  );
}
