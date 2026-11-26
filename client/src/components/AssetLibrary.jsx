import { useMemo, useState } from 'react';
import { Search, X, PlayCircle } from 'lucide-react';
import {
  ASSET_TYPES,
  ASSET_TYPE_LABELS,
  selectAssets,
  countByType,
  isVideoAsset,
  assetTypeLabel,
} from '@director/shared/rules/assets.js';
import { ASSET_STATUS } from '@director/shared/constants/status.js';

const SOURCE_LABELS = {
  assistant: 'AI 助手',
  workbench: '工作台',
};

export default function AssetLibrary({ plan }) {
  const assets = Array.isArray(plan?.assets) ? plan.assets : [];
  const [type, setType] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [active, setActive] = useState(null);

  const counts = useMemo(() => countByType(assets), [assets]);
  const visible = useMemo(
    () => selectAssets(assets, { type, keyword }),
    [assets, type, keyword]
  );

  return (
    <div className="asset-library">
      <div className="asset-library-head">
        <div className="asset-search">
          <Search size={15} aria-hidden />
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索标题、人物或提示词"
            aria-label="搜索资产"
            className="asset-search-input"
          />
        </div>
      </div>

      <div className="asset-type-tabs" role="tablist" aria-label="按类型筛选">
        <button
          type="button"
          role="tab"
          aria-selected={type === 'all'}
          className={type === 'all' ? 'is-active' : ''}
          onClick={() => setType('all')}
        >
          全部 <span>{counts.all}</span>
        </button>
        {ASSET_TYPES.filter((t) => counts[t] > 0).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={type === t}
            className={type === t ? 'is-active' : ''}
            onClick={() => setType(t)}
          >
            {ASSET_TYPE_LABELS[t]} <span>{counts[t]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="muted asset-empty">没有符合条件的资产，换个关键词或类型试试。</p>
      ) : (
        <div className="asset-grid">
          {visible.map((asset) => (
            <figure key={asset.id} className="asset-card" data-testid={`asset-card-${asset.id}`}>
              <button
                type="button"
                className="asset-thumb"
                onClick={() => setActive(asset)}
                aria-label={`预览 ${asset.title || asset.characterName || '资产'}`}
              >
                {isVideoAsset(asset) ? (
                  <>
                    <video src={asset.url} className="asset-thumb-media" preload="metadata" muted />
                    <span className="asset-play" aria-hidden>
                      <PlayCircle size={28} />
                    </span>
                  </>
                ) : (
                  <img src={asset.url} alt="" className="asset-thumb-media" />
                )}
              </button>
              <figcaption className="asset-meta">
                <span className="asset-badge">{assetTypeLabel(asset.type)}</span>
                {asset.status === ASSET_STATUS.STALE && (
                  <span className="asset-stale">待更新</span>
                )}
                <b className="asset-name">{asset.characterName || asset.title || '未命名'}</b>
                <small className="asset-source">
                  {SOURCE_LABELS[asset.source] || '工作台'}
                </small>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {active && (
        <div
          className="asset-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            className="asset-lightbox-close"
            aria-label="关闭预览"
            onClick={() => setActive(null)}
          >
            <X size={20} />
          </button>
          {isVideoAsset(active) ? (
            <video
              src={active.url}
              controls
              autoPlay
              className="asset-lightbox-media"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={active.url}
              alt=""
              className="asset-lightbox-media"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}
