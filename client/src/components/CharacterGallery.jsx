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
        <div key={c.name} className="rounded-lg border border-stone-800 bg-stone-900/60 p-3">
          <div className="flex h-40 items-center justify-center overflow-hidden rounded bg-stone-800">
            {images[c.name] ? (
              <img src={images[c.name]} alt={c.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-stone-500">暂无形象</span>
            )}
          </div>
          <p className="mt-2 font-serif text-amber-200">{c.name}</p>
          <p className="text-xs text-stone-400 line-clamp-2">{c.description}</p>
          <button
            onClick={() => generate(c)}
            disabled={busyName === c.name}
            className="mt-2 w-full rounded bg-amber-200/90 py-1 text-xs text-stone-900 disabled:opacity-50"
          >
            {busyName === c.name ? '生成中…' : '生成形象'}
          </button>
        </div>
      ))}
    </div>
  );
}
