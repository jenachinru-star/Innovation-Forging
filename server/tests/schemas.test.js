import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../schemas/auth.js';
import { projectUpsertSchema } from '../schemas/project.js';
import {
  scriptGenerateSchema,
  characterImageSchema,
  visualGenerateSchema,
  videoTaskSchema,
  discussionAnalyzeSchema,
} from '../schemas/ai.js';

describe('auth schema', () => {
  it('合法注册通过', () => {
    const r = registerSchema.safeParse({ username: 'director', password: 'secret123' });
    expect(r.success).toBe(true);
  });

  it('空用户名 400', () => {
    const r = registerSchema.safeParse({ username: ' ', password: 'secret123' });
    expect(r.success).toBe(false);
  });

  it('短密码 400', () => {
    const r = registerSchema.safeParse({ username: 'u2', password: '123' });
    expect(r.success).toBe(false);
  });

  it('登录缺密码 400', () => {
    const r = loginSchema.safeParse({ username: 'ghost' });
    expect(r.success).toBe(false);
  });
});

describe('project schema（strip 过渡）', () => {
  it('宽松旧记录通过，未知字段被剔除', () => {
    const r = projectUpsertSchema.safeParse({
      name: '旧作品',
      unknownField: '应被剔除',
      plan: {
        name: '方案',
        cues: [{ id: 'cue-1', content: '加定点', status: 'draft' }],
        briefs: [{ id: 'brief-1', original: '原话', status: 'needsReview' }],
        impacts: [{ id: 'imp-1', reason: '台词删除', status: 'open' }],
      },
    });
    expect(r.success).toBe(true);
    expect(r.data.unknownField).toBeUndefined();
    expect(r.data.plan.cues).toHaveLength(1);
    expect(r.data.plan.briefs[0].status).toBe('needsReview');
  });

  it('非法影响项状态被拒', () => {
    const r = projectUpsertSchema.safeParse({
      plan: { impacts: [{ id: 'imp-1', status: 'not-a-status' }] },
    });
    expect(r.success).toBe(false);
  });

  it('数组缺失时兜底为空数组', () => {
    const r = projectUpsertSchema.safeParse({ plan: { name: 'x' } });
    expect(r.success).toBe(true);
    expect(r.data.plan.cues).toEqual([]);
    expect(r.data.plan.briefs).toEqual([]);
  });
});

describe('ai 入参 schema', () => {
  it('剧本生成缺素材 400', () => {
    expect(scriptGenerateSchema.safeParse({}).success).toBe(false);
    expect(scriptGenerateSchema.safeParse({ material: 'x' }).success).toBe(true);
  });

  it('人物图缺名称或描述 400', () => {
    expect(characterImageSchema.safeParse({ name: '甲' }).success).toBe(false);
    expect(
      characterImageSchema.safeParse({ name: '甲', description: '书生' }).success
    ).toBe(true);
  });

  it('视觉缺描述 400，尺寸格式非法 400', () => {
    expect(visualGenerateSchema.safeParse({}).success).toBe(false);
    expect(
      visualGenerateSchema.safeParse({ description: '戏台', size: 'big' }).success
    ).toBe(false);
    expect(
      visualGenerateSchema.safeParse({ description: '戏台', size: '1024x1024' }).success
    ).toBe(true);
  });

  it('视频缺镜头 400，比例格式非法 400，时长越界 400', () => {
    expect(videoTaskSchema.safeParse({}).success).toBe(false);
    expect(videoTaskSchema.safeParse({ prompt: '推进', ratio: 'wide' }).success).toBe(false);
    expect(videoTaskSchema.safeParse({ prompt: '推进', duration: 99 }).success).toBe(false);
    expect(
      videoTaskSchema.safeParse({ prompt: '推进', ratio: '16:9', duration: 5 }).success
    ).toBe(true);
  });

  it('讨论分析 kind 限 audio/text，其余字段可选', () => {
    expect(discussionAnalyzeSchema.safeParse({ kind: 'video' }).success).toBe(false);
    expect(
      discussionAnalyzeSchema.safeParse({ kind: 'text', text: '讨论' }).success
    ).toBe(true);
  });
});
