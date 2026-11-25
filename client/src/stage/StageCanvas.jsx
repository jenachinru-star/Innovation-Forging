import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import { VIEW_W, VIEW_H, clamp } from './geometry.js';
import { themeFor } from './palette.js';
import GridLayer from './GridLayer.jsx';
import PathLayer from './PathLayer.jsx';
import PropNode from './PropNode.jsx';
import ActorNode from './ActorNode.jsx';

const bound = (pos) => ({
  x: clamp(pos.x, 0, VIEW_W),
  y: clamp(pos.y, 0, VIEW_H),
});

// 节点式 2D 画布：逻辑坐标固定 800x480，按容器宽度等比缩放。
export default function StageCanvas({
  actors,
  objects,
  paths,
  draftPoints,
  settings,
  isWire,
  focusPath,
  stageEditable,
  stageRef,
  locked,
  onFrameDragEnd,
  onDoorDragEnd,
  onActorDragStart,
  onActorDragMove,
  onActorDragEnd,
  onObjectDragStart,
  onObjectDragMove,
  onObjectDragEnd,
  onObjectClick,
}) {
  const theme = themeFor(isWire);
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  const { frame, doors, grid } = settings;
  const fixedDraggable = stageEditable && !locked;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale((el.clientWidth || VIEW_W) / VIEW_W);
    update();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(update);
      observer.observe(el);
      return () => observer.disconnect();
    }
    return undefined;
  }, []);

  return (
    <div
      ref={wrapRef}
      data-testid="konva-stage-wrap"
      className="w-full touch-none select-none"
      style={{ height: VIEW_H * scale }}
    >
      <Stage ref={stageRef} width={VIEW_W} height={VIEW_H} scaleX={scale} scaleY={scale}>
        <Layer>
          <Rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill={theme.bg} />

          <Text
            x={300}
            y={8}
            width={200}
            align="center"
            fontSize={15}
            fill={theme.mutedText}
            text="观众方向"
          />

          {grid.showGrid && <GridLayer spacing={grid.spacing} theme={theme} />}

          <Group
            id="stage-frame-group"
            x={frame.x}
            y={frame.y}
            draggable={fixedDraggable}
            dragBoundFunc={bound}
            onDragEnd={(event) => onFrameDragEnd?.(event)}
          >
            <Rect
              x={0}
              y={0}
              width={frame.width}
              height={frame.height}
              cornerRadius={10}
              fill={theme.frameFill}
              stroke={fixedDraggable ? theme.cue : theme.frameStroke}
              dash={fixedDraggable ? [6, 6] : undefined}
              strokeWidth={2}
            />
          </Group>

          <PathLayer paths={paths} draftPoints={draftPoints} theme={theme} focusPath={focusPath} />

          {objects.map((object) => (
            <PropNode
              key={object.id}
              object={object}
              theme={theme}
              locked={locked}
              onDragStart={onObjectDragStart}
              onDragMove={onObjectDragMove}
              onDragEnd={onObjectDragEnd}
              onClick={onObjectClick}
            />
          ))}

          <Group
            id="stage-door-up"
            x={doors.up.x}
            y={doors.up.y}
            draggable={fixedDraggable}
            dragBoundFunc={bound}
            onDragEnd={(event) => onDoorDragEnd?.('up', event)}
          >
            <Rect
              x={0}
              y={0}
              width={doors.up.width}
              height={doors.up.height}
              cornerRadius={4}
              fill={theme.doorFill}
              stroke={fixedDraggable ? theme.cue : theme.doorStroke}
              strokeWidth={2}
            />
            <Text
              x={0}
              y={40}
              width={doors.up.width}
              align="center"
              fontSize={12}
              fill={theme.inkText}
              text="上场口"
            />
          </Group>

          <Group
            id="stage-door-down"
            x={doors.down.x}
            y={doors.down.y}
            draggable={fixedDraggable}
            dragBoundFunc={bound}
            onDragEnd={(event) => onDoorDragEnd?.('down', event)}
          >
            <Rect
              x={0}
              y={0}
              width={doors.down.width}
              height={doors.down.height}
              cornerRadius={4}
              fill={theme.doorFill}
              stroke={fixedDraggable ? theme.cue : theme.doorStroke}
              strokeWidth={2}
            />
            <Text
              x={0}
              y={40}
              width={doors.down.width}
              align="center"
              fontSize={12}
              fill={theme.inkText}
              text="下场口"
            />
          </Group>

          {actors.map((actor) => (
            <ActorNode
              key={actor.id}
              actor={actor}
              theme={theme}
              isWire={isWire}
              locked={locked}
              onDragStart={onActorDragStart}
              onDragMove={onActorDragMove}
              onDragEnd={onActorDragEnd}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
