import { describe, it, expect } from 'vitest';
import { summarizeDiscussion } from '../services/discussion.js';

const validJson = JSON.stringify({
  overview: '概述',
  decisions: ['决定1'],
  todos: ['待办1'],
  changes: [],
  questions: ['问题1'],
});

it('chat 返回 JSON 时归一化纪要', async () => {
  const chat = async () => validJson;
  const result = await summarizeDiscussion('原文', { chat });
  expect(result.overview).toBe('概述');
  expect(result.decisions).toEqual(['决定1']);
  expect(result.questions).toEqual(['问题1']);
});

it('首次非 JSON、第二次成功时回退重试', async () => {
  let n = 0;
  const chat = async () => {
    n += 1;
    return n === 1 ? '坏格式' : validJson;
  };
  const result = await summarizeDiscussion('原文', { chat });
  expect(result.overview).toBe('概述');
});

it('包裹在代码块中的 JSON 也能解析', async () => {
  const chat = async () => `\`\`\`json\n${validJson}\n\`\`\``;
  const result = await summarizeDiscussion('原文', { chat });
  expect(result.decisions).toEqual(['决定1']);
});

it('空内容抛错', async () => {
  await expect(
    summarizeDiscussion('  ', { chat: async () => validJson })
  ).rejects.toThrow(/为空/);
});

it('全部失败时抛错', async () => {
  const chat = async () => {
    throw new Error('upstream down');
  };
  await expect(summarizeDiscussion('原文', { chat })).rejects.toThrow(
    /纪要生成失败/
  );
});

it('非数组字段被归一化为空数组', async () => {
  const chat = async () => JSON.stringify({ overview: 'x', decisions: 'bad' });
  const result = await summarizeDiscussion('原文', { chat });
  expect(result.decisions).toEqual([]);
});
