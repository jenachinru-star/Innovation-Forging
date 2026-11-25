export default function ScheduleTable({ scriptData, onChangeScene }) {
  const scenes = scriptData?.scenes || [];
  return (
    <div>
      {scriptData?.summary && (
        <p className="card mb-4 rounded-md p-3 text-sm">
          {scriptData.summary}
        </p>
      )}
      {scenes.length === 0 ? (
        <p className="muted text-sm">未解析到场次信息。</p>
      ) : (
        <div className="table-card overflow-x-auto">
          <table className="paper-table text-left text-sm">
            <thead>
              <tr>
                <th>场次</th>
                <th>地点</th>
                <th>出场人物</th>
                <th>在场人物</th>
                <th>道具</th>
                <th>舞台说明</th>
                <th>时长</th>
                <th>剧情摘要</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map((s, idx) => (
                <tr key={`${s.sceneNumber}-${s.title}`} className="align-top">
                  <td className="whitespace-nowrap">{s.title || `第 ${s.sceneNumber} 场`}</td>
                  <td>
                    {onChangeScene ? (
                      <input
                        value={s.location ?? ''}
                        onChange={(e) => onChangeScene(idx, { location: e.target.value })}
                        className="cell-input w-full"
                      />
                    ) : (
                      s.location
                    )}
                  </td>
                  <td>{(s.characters ?? []).join('、')}</td>
                  <td>{(s.presentCharacters ?? []).join('、')}</td>
                  <td>{(s.props ?? []).join('、')}</td>
                  <td>{(s.stageDirections ?? []).join('、')}</td>
                  <td className="whitespace-nowrap">
                    {onChangeScene ? (
                      <input
                        type="number"
                        value={s.estimatedMinutes ?? 0}
                        onChange={(e) => onChangeScene(idx, { estimatedMinutes: Number(e.target.value) })}
                        className="cell-input w-16"
                      />
                    ) : (
                      `${s.estimatedMinutes ?? 0} 分钟`
                    )}
                  </td>
                  <td>
                    {onChangeScene ? (
                      <input
                        value={s.summary ?? ''}
                        onChange={(e) => onChangeScene(idx, { summary: e.target.value })}
                        className="cell-input w-full"
                      />
                    ) : (
                      s.summary
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
