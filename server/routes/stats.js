import { Router } from 'express';
import { createRequireAuth } from '../middleware/requireAuth.js';

/**
 * 项目统计端点：GET /api/stats/:id
 * 返回剧本与制作方案的聚合计数，供总览与交付核对。
 * 归属校验与 projects 一致：非本人作品统一 404。
 */
export function createStatsRouter(deps = {}) {
  const store = deps.store;
  const requireAuth = createRequireAuth(store);
  const router = Router();

  router.use(requireAuth);

  router.get('/:id', (req, res) => {
    const record = store.getProject(req.params.id);
    if (!record || record.userId !== req.user.username) {
      return res.status(404).json({ error: '作品不存在' });
    }
    const scriptData = record.scriptData || {};
    const plan = record.plan || {};
    const scenes = Array.isArray(scriptData.scenes) ? scriptData.scenes : [];
    const characters = Array.isArray(scriptData.characters) ? scriptData.characters : [];
    const relationships = Array.isArray(scriptData.relationships) ? scriptData.relationships : [];
    const cues = Array.isArray(plan.cues) ? plan.cues : [];
    const briefs = Array.isArray(plan.briefs) ? plan.briefs : [];
    const rehearsals = Array.isArray(plan.rehearsals) ? plan.rehearsals : [];
    const impacts = Array.isArray(plan.impacts) ? plan.impacts : [];
    const assets = Array.isArray(plan.assets) ? plan.assets : [];
    const discussions = Array.isArray(plan.discussions) ? plan.discussions : [];
    const propTotal = scenes.reduce(
      (n, scene) => n + (Array.isArray(scene && scene.props) ? scene.props.length : 0),
      0
    );
    return res.json({
      stats: {
        sceneCount: scenes.length,
        characterCount: characters.length,
        relationshipCount: relationships.length,
        cueCount: cues.length,
        briefCount: briefs.length,
        rehearsalCount: rehearsals.length,
        impactOpenCount: impacts.filter((i) => i && i.status === 'open').length,
        assetCount: assets.length,
        discussionCount: discussions.length,
        propTotal,
      },
    });
  });

  return router;
}