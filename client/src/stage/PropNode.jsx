import { Group, Rect, Text } from 'react-konva';
import { VIEW_W, VIEW_H, clamp } from './geometry.js';

// 舞台固定物（桌/椅/道具）：矩形 + 标签，旋转与缩放后的尺寸由父层算好传入。
export default function PropNode({
  object,
  theme,
  locked,
  onDragStart,
  onDragMove,
  onDragEnd,
  onClick,
}) {
  const { id, label, kind, x, y, width, height, rotation, selected } = object;
  return (
    <Group
      id={`stage-object-${id}`}
      x={x}
      y={y}
      rotation={rotation || 0}
      draggable={!locked}
      dragBoundFunc={(pos) => ({
        x: clamp(pos.x, 0, VIEW_W),
        y: clamp(pos.y, 0, VIEW_H),
      })}
      onDragStart={(event) => onDragStart?.(event, object)}
      onDragMove={(event) => onDragMove?.(event, object)}
      onDragEnd={(event) => onDragEnd?.(event, object)}
      onClick={() => onClick?.(object)}
    >
      <Rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        cornerRadius={3}
        fill={theme.objectFill}
        stroke={selected ? theme.cue : theme.objectStroke}
        strokeWidth={2}
      />
      <Text
        x={-width / 2}
        y={-7}
        width={width}
        align="center"
        fontSize={11}
        fill={theme.objectLabel}
        text={label || kind || ''}
      />
    </Group>
  );
}
