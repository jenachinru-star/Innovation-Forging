import { useState } from 'react';
import { ASSET_STATUS } from '@director/shared/constants/status.js';
import { buildStylePrompt } from '../data/styles.js';

export default function CharacterGallery({ characters, styleProfile, assets = [], dispatch }) {
  const initialImages = Object.fromEntries(
    (Array.isArray(assets) ? assets : [])
      .filter((asset) => asset?.type === 'character' && asset?.characterName && asset?.url)
      .map((asset) => [asset.characterName, asset.url])
  );
  const [images, setImages] = useState(initialImages);
  const [busyName, setBusyName] = useState('');
  const [error, setError] = useState('');

  async function generate(c) {
    setBusyName(c.name);
    try {
      const res = await fetch('/api/character/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: c.name,
          description: c.description,
          stylePrompt: buildStylePrompt(styleProfile, c.name),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成失败');
      setImages((prev) => ({ ...prev, [c.name]: data.imageUrl }));
      dispatch?.({
        type: 'upsertAsset',
        asset: {
          id: `character-${c.id || c.name}`,
          type: 'character',
          characterName: c.name,
          status: ASSET_STATUS.SELECTED,
          url: data.imageUrl,
          styleProfile: styleProfile || null,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (e) {
      setImages((prev) => ({ ...prev, [c.name]: '' }));
      setError(String(e.message || e));
    } finally {
      setBusyName('');
    }
  }

  return (
    <div>
      {error && (
        <p role="alert" className="alert-error mb-4 p-3 text-sm">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {(characters || []).map((c) => {
          const asset = (Array.isArray(assets) ? assets : []).find(
            (item) => item?.characterName === c.name
          );
          return (
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
              <div className="character-asset-title">
                <p className="font-serif mt-2">{c.name}</p>
                {asset?.status === ASSET_STATUS.STALE && (
                  <span className="status-stamp status-review">待更新</span>
                )}
              </div>
              <p className="media-muted line-clamp-2 text-xs">{c.description}</p>
              <button
                type="button"
                onClick={() => generate(c)}
                disabled={busyName === c.name}
                className="btn-media mt-2 w-full py-1 text-xs"
              >
                {busyName === c.name
                  ? '生成中…'
                  : asset?.status === ASSET_STATUS.STALE
                    ? '重新生成'
                    : '生成形象'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
