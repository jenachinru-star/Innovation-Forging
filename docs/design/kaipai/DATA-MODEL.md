# 开排 · 数据与上下游契约

## 原则

1. 剧本原文与版本是事实源。
2. AI 建议、用户确认、系统派生必须可区分。
3. 任何提示、需求、走位或视觉资产都必须保留场景或原文锚点。
4. 上游变化只生成影响记录，不静默覆盖已确认内容。
5. 外部生成结果保存提示版本、引用资产、模型与输入参数。

## 项目层

```text
Project
  id, name, medium, status
  currentScriptVersionId
  scriptVersions[]
  productionPlans[]
  styleProfile
  assets[]
  createdAt, updatedAt
```

`medium` 首版固定为 `stage`，数据结构允许后续增加 `film` 和 `ai-video`。

## 剧本层

```text
ScriptVersion
  id, sourceKind, filename, rawText
  parser: local | ai
  warnings[]
  createdAt
  data: ScriptData

Scene
  id, actId, sceneNumber, title, location
  characters[], presentCharacters[]
  props[], stageDirections[]
  lines[{ id, speaker, text, offset }]
  structure, estimatedMinutes, summary
  rawRange{start,end}|null

Character
  id, name, aliases[], description

Relationship
  id, from, to, relation
  needsReview, evidence{sceneId,quote}
```

场次、人物与关系只能引用当前 `ScriptVersion`。切换版本时，下游对象通过锚点检查是否仍存在。

## 制作层

```text
ProductionPlan
  id, name, sourceVersionId
  segments[], cues[], briefs[]
  staging, rehearsals[], impacts[]
  style, assets[]

Segment
  id, title, sceneIds[], castIds[], goals[]

StageLayout
  stage{width,depth,audienceSide}
  placements[{sceneNumber,characterId,x,y,facing}]
  objects[{id,sceneNumber,kind,label,x,y,rotation,scale}]
  paths[{id,sceneNumber,characterId,points[],triggerQuote}]
  notes[]

Cue
  id, department, sceneId, sceneNumber
  anchor{kind,sceneId,quote}
  trigger{type,quote,offset}
  content, status, owner, note

Brief
  id, department, sceneId, sceneNumber, cueId|null
  anchor{kind,sceneId,quote}
  original, items[], uncertain[]
  priority, dueDate, status, owner, note

Rehearsal
  id, date, location, castIds[]
  notes, decisions[], openQuestions[], todos[]

Impact
  id, change{kind,refId,description}
  target{kind,refId}
  reason, suggestion, status
```

`department ∈ {lighting, music, sound, scenery}`。灯光与音乐、音响保持独立部门。

## 视觉层

```text
StyleProfile
  familyId, familyName, directorId?, directorName?
  palette[5]
  tonalReference|null
  visualGrammar[]
  targetId, prompt, updatedAt

Asset
  id, type, status
  sceneId?, characterId?, cueId?
  sourceAssetIds[]
  prompt, promptVersion
  provider, model, inputs
  url|blobKey
  staleReason|null
  updatedAt
```

首版资产类型：`character | location | prop | keyframe | poster`。视频镜头作为后续 `shot-video` 扩展。

## 状态机

```text
内容：draft → review → confirmed → delivered
任务：prompt-ready → queued → generating → candidate → selected
失败：任何任务 → failed
过期：selected → stale
```

剧本或视觉风格变化时：

1. 比较新旧 `ScriptData`。
2. 为失去原文或动作锚点的 cue / brief 创建 `Impact`。
3. 将依赖受影响场次或人物的资产标为 `stale`。
4. 所有动作进入“待处理”，由用户逐项确认。

## 本地存储

- `project:current`：当前工作状态，保证刷新恢复。
- `project:<id>`：作品库记录。
- 作品归档：`.kaipai.json`，包含剧本、制作方案、视觉风格、资产元数据和可选内嵌图片。
- 无 IndexedDB 时降级到内存，界面必须明确“本次会话后失效”。

## AI 调用边界

- 本地规则解析、影响检查、提示词拼装和导出不依赖 AI。
- 每个作品首次启用智能增强时记录授权时间。
- 文本增强遵守作品级授权；图片与视频任务仍显示服务、预计成本和最大数量。
- 未满足授权、预算或服务条件时，保留“复制提示词/手动上传资产”路径。
