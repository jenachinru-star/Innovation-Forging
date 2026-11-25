import { z } from 'zod';
import { optionalString, optionalNumber, optionalDate, stringArray } from './common.js';
import { planSchema } from './plan.js';
import { scriptDataSchema, scriptVersionSchema } from './scriptData.js';

/**
 * 项目落库记录 schema（strip 过渡：剔除未知字段，不拒旧记录）。
 * userId 由服务端强制覆盖，不取自请求体；id 取自路由参数。
 */
export const projectUpsertSchema = z.object({
  name: optionalString(200),
  summary: optionalString(4000),
  status: optionalString(50),
  sceneCount: optionalNumber(0),
  updatedAt: optionalDate,
  step: optionalString(50),
  activeNav: optionalString(50),
  activeTab: optionalString(50),
  scriptText: optionalString(200000),
  scriptVersions: z.array(scriptVersionSchema).optional().nullable().transform((v) =>
    Array.isArray(v) ? v : []
  ),
  scriptData: scriptDataSchema.optional().nullable(),
  plan: planSchema.optional().nullable(),
  // 以下两个为前端偶发回传的 UI/素材态，宽松保留
  activeSceneIds: stringArray,
}).strip();
