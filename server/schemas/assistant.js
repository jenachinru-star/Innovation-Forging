import { z } from 'zod';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string().max(20000, '单条消息过长'),
});

export const assistantChatSchema = z.object({
  messages: z.array(messageSchema).min(1, '消息不能为空').max(50, '消息数量过多'),
  context: z
    .object({
      projectName: z.string().max(200).optional().nullable(),
      sceneCount: z.number().int().nonnegative().optional().nullable(),
      characterCount: z.number().int().nonnegative().optional().nullable(),
    })
    .optional()
    .nullable(),
});
