import { Line } from 'react-konva';

function flatten(points) {
  return points.flatMap((point) => [Number(point.x) || 0, Number(point.y) || 0]);
}

// 已确认走位路径（虚线）+ 录制中的草稿路径。
export default function PathLayer({ paths, draftPoints, theme, focusPath }) {
  return (
    <>
      {paths.map((path) =>
        Array.isArray(path.points) && path.points.length > 1 ? (
          <Line
            key={path.id}
            id={`path-${path.id}`}
            points={flatten(path.points)}
            stroke={theme.pathStroke}
            strokeWidth={focusPath ? 2.5 : 2}
            dash={[6, 6]}
            lineCap="round"
            lineJoin="round"
            listening={false}
          />
        ) : null
      )}
      {Array.isArray(draftPoints) && draftPoints.length > 1 && (
        <Line
          points={flatten(draftPoints)}
          stroke={theme.cue}
          strokeWidth={3}
          dash={[5, 5]}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      )}
    </>
  );
}
