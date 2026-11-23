export default function ScheduleTable({ scriptData, onChangeScene }) {
  const scenes = scriptData?.scenes || [];
  return (
    <div>
      {scriptData?.summary && (
        <p className="mb-4 rounded-md bg-stone-800/60 p-3 text-sm text-stone-200">
          {scriptData.summary}
        </p>
      )}
      {scenes.length === 0 ? (
        <p className="text-sm text-stone-400">未解析到场次信息。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-700 text-stone-400">
                <th className="p-2">场次</th>
                <th className="p-2">地点</th>
                <th className="p-2">出场人物</th>
                <th className="p-2">道具</th>
                <th className="p-2">时长</th>
                <th className="p-2">剧情摘要</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map((s, idx) => (
                <tr key={`${s.sceneNumber}-${s.title}`} className="border-b border-stone-800 align-top">
                  <td className="p-2 whitespace-nowrap">{s.title || `第 ${s.sceneNumber} 场`}</td>
                  <td className="p-2">
                    {onChangeScene ? (
                      <input
                        value={s.location}
                        onChange={(e) => onChangeScene(idx, { location: e.target.value })}
                        className="w-full bg-transparent outline-none"
                      />
                    ) : (
                      s.location
                    )}
                  </td>
                  <td className="p-2">{(s.characters ?? []).join('、')}</td>
                  <td className="p-2">{(s.props ?? []).join('、')}</td>
                  <td className="p-2 whitespace-nowrap">
                    {onChangeScene ? (
                      <input
                        type="number"
                        value={s.estimatedMinutes ?? 0}
                        onChange={(e) => onChangeScene(idx, { estimatedMinutes: Number(e.target.value) })}
                        className="w-16 bg-transparent outline-none"
                      />
                    ) : (
                      `${s.estimatedMinutes ?? 0} 分钟`
                    )}
                  </td>
                  <td className="p-2">
                    {onChangeScene ? (
                      <input
                        value={s.summary}
                        onChange={(e) => onChangeScene(idx, { summary: e.target.value })}
                        className="w-full bg-transparent outline-none"
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
