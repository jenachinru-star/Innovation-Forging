import { Group, Line } from 'react-konva';
import { VIEW_W, VIEW_H } from './geometry.js';

// 等距参考网格：竖线 + 横线，覆盖整个逻辑画布，不参与事件。
export default function GridLayer({ spacing, theme }) {
  const step = Number(spacing) > 0 ? Number(spacing) : 40;
  const lines = [];

  for (let x = 0; x <= VIEW_W; x += step) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, VIEW_H]}
        stroke={theme.frameStroke}
        strokeWidth={1}
        opacity={0.32}
      />
    );
  }
  for (let y = 0; y <= VIEW_H; y += step) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, VIEW_W, y]}
        stroke={theme.frameStroke}
        strokeWidth={1}
        opacity={0.32}
      />
    );
  }

  return <Group listening={false}>{lines}</Group>;
}
