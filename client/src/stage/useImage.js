import { useEffect, useState } from 'react';

// 等价 react-konva useImage 的本地实现（19.3.2 精简核心未导出该 hook）。
// 传入 url，加载原生 HTMLImageElement，返回 [image, status]。
export default function useImage(url) {
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!url) {
      setImage(null);
      setStatus('loaded');
      return undefined;
    }

    let active = true;
    const img = new Image();
    img.onload = () => {
      if (!active) return;
      setImage(img);
      setStatus('loaded');
    };
    img.onerror = () => {
      if (!active) return;
      setImage(null);
      setStatus('failed');
    };
    img.src = url;

    return () => {
      active = false;
    };
  }, [url]);

  return [image, status];
}
