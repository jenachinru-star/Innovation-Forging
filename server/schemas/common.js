import { z } from 'zod';

/** 可选字符串，可限长；null 与缺失都视为空 */
export const optionalString = (max = 2000) =>
  z.string().trim().max(max).optional().nullable().transform((v) => v ?? '');

/** 字符串数组；非数组输入兜底为空数组（宽容旧数据） */
export const stringArray = z.array(z.string().trim()).optional().nullable().transform((v) =>
  Array.isArray(v) ? v.filter(Boolean) : []
);

/** 受限 id（字母数字、连字符、下划线、#），缺失回退空串 */
export const idString = z.string().trim().optional().nullable().transform((v) => v ?? '');

/** 宽松数值：能转成有限数则取数，否则回退 fallback */
export const optionalNumber = (fallback = null) =>
  z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((v) => {
      if (v == null || v === '') return fallback;
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    });

/** 任意可序列化对象（用于 style / summary 等结构松散的嵌套） */
export const looseObject = z
  .record(z.unknown())
  .optional()
  .nullable()
  .transform((v) => (v && typeof v === 'object' ? v : {}));

/** ISO 时间字符串，宽松校验，不强制可解析 */
export const optionalDate = z.string().optional().nullable().transform((v) => v ?? null);
