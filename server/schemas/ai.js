import { z } from 'zod';

const requiredString = (message, max = 4000) =>
  z.string({ required_error: message, invalid_type_error: message }).trim().min(1, message).max(max);

/** 剧本生成：素材文本 */
export const scriptGenerateSchema = z.object({
  material: requiredString('请提供素材内容', 20000),
});

/** 剧本解析：剧本文本 */
export const scriptParseSchema = z.object({
  scriptText: requiredString('请提供剧本内容', 200000),
});

/** 人物形象生成 */
export const characterImageSchema = z.object({
  name: requiredString('缺少人物名称', 200),
  description: requiredString('缺少人物描述', 4000),
  stylePrompt: z.string().trim().max(2000, '风格描述过长').optional().nullable(),
});

/** 视觉画面生成 */
export const visualGenerateSchema = z.object({
  description: requiredString('请先描述想要的画面', 4000),
  styleName: z.string().trim().max(100).optional().nullable(),
  size: z.string().regex(/^\d+x\d+$/, '尺寸格式应为 宽x高').optional().nullable(),
});

/** 视频任务创建 */
export const videoTaskSchema = z.object({
  prompt: requiredString('请先描述想要的镜头', 4000),
  ratio: z.string().regex(/^\d+:\d+$/, '画幅比例格式应为 宽:高').optional().nullable(),
  duration: z.coerce.number().int().min(1, '时长过短').max(30, '时长过长').optional().nullable(),
  imageUrl: z.string().trim().max(2000).optional().nullable(),
});

/** 讨论分析：kind 分支非空由路由按 audio/text 分别判断，schema 只做类型与白名单 */
export const discussionAnalyzeSchema = z.object({
  kind: z.enum(['audio', 'text']).optional().nullable(),
  text: z.string().trim().max(200000).optional().nullable(),
  audioData: z.string().max(15 * 1024 * 1024, '录音数据过大').optional().nullable(),
  audioFormat: z.string().trim().max(100).optional().nullable(),
  durationSec: z.coerce.number().int().min(0).optional().nullable(),
});
