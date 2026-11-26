import { Group, Circle, Image, Text } from 'react-konva';
import useImage from './useImage.js';
import { VIEW_W, VIEW_H, clamp } from './geometry.js';

// 单个角色：圆形底盘 + 可选圆裁头像（无图回退名字）+ 底部 caption。
export default function ActorNode({
  actor,
  theme,
  isWire,
  locked,
  onDragStart,
  onDragMove,
  onDragEnd,
}) {
  const { id, label, x, y, imageUrl, dragging } = actor;
  const [image] = useImage(isWire ? undefined : imageUrl);

  return (
    <Group
      id={`actor-${id}`}
      x={x}
      y={y}
      draggable={!locked}
      dragBoundFunc={(pos) => ({
        x: clamp(pos.x, 0, VIEW_W),
        y: clamp(pos.y, 0, VIEW_H),
      })}
      onDragStart={(event) => onDragStart?.(event, actor)}
      onDragMove={(event) => onDragMove?.(event, actor)}
      onDragEnd={(event) => onDragEnd?.(event, actor)}
    >
      <Circle
        radius={26}
        fill={theme.actorFill}
        stroke={dragging ? theme.seal : theme.actorStroke}
        strokeWidth={2}
      />

      {!isWire && image && (
        <Image
          image={image}
          x={-26}
          y={-26}
          width={52}
          height={52}
          clipFunc={(ctx) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, 26, 0, Math.PI * 2, false);
            ctx.clip();
          }}
        />
      )}

      {!isWire && !image && (
        <Text
          x={-26}
          y={-7}
          width={52}
          align="center"
          fontSize={13}
          fill={theme.actorName}
          text={label}
        />
      )}

      <Text
        x={-70}
        y={34}
        width={140}
        align="center"
        fontSize={12}
        fill={theme.actorCaption}
        text={label}
      />
    </Group>
  );
}
