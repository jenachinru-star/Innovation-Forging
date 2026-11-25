import { describe, it, expect, vi, afterEach } from 'vitest';
import { useReducer } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VisualStudio from './VisualStudio.jsx';
import { createPlan, planReducer } from '../store/plan.js';
import { DIRECTOR_STYLES, STYLE_FAMILIES } from '../data/styles.js';

function Harness() {
  const [plan, dispatch] = useReducer(planReducer, undefined, () =>
    createPlan('stage', '测试方案')
  );
  return <VisualStudio scriptData={{ characters: [] }} plan={plan} dispatch={dispatch} />;
}

afterEach(() => vi.unstubAllGlobals());

describe('VisualStudio', () => {
  it('风格库包含 10 个视觉族和 24 位精选导演', () => {
    expect(STYLE_FAMILIES).toHaveLength(10);
    expect(DIRECTOR_STYLES).toHaveLength(24);
  });

  it('渲染标题、风格下拉、描述输入与生成按钮', () => {
    render(<Harness />);
    expect(screen.getByText('视觉制作')).toBeInTheDocument();
    expect(screen.getByLabelText('画面描述')).toBeInTheDocument();
    expect(screen.getByText('生成').closest('button')).toBeInTheDocument();
  });

  it('描述为空时生成按钮禁用，输入后启用', () => {
    render(<Harness />);
    expect(screen.getByText('生成').closest('button').disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('画面描述'), {
      target: { value: '黄昏下的老戏台' },
    });
    expect(screen.getByText('生成').closest('button').disabled).toBe(false);
  });

  it('初始网格渲染本地场景图卡片，带标题与场景角标', () => {
    render(<Harness />);
    expect(screen.getByTestId('visual-card-scene-livingroom')).toBeInTheDocument();
    expect(screen.getByTestId('visual-card-scene-doorway')).toBeInTheDocument();
    expect(screen.getByTestId('visual-card-scene-key')).toBeInTheDocument();
    expect(screen.getByTestId('visual-card-scene-livingroom').textContent).toContain('场景');
  });

  it('生成成功：出现 loading，完成后派发 upsertAsset 并新增图片卡片', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ imageUrl: 'http://new/1.png' }),
      }))
    );
    render(<Harness />);

    fireEvent.change(screen.getByLabelText('画面描述'), {
      target: { value: '雨夜小巷' },
    });
    fireEvent.click(screen.getByText('生成').closest('button'));

    expect(screen.getByTestId('visual-loading')).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByTestId('visual-card-asset-1')).toBeInTheDocument()
    );
    expect(screen.getByTestId('visual-card-asset-1').querySelector('img').src).toContain(
      'http://new/1.png'
    );
    expect(screen.queryByTestId('visual-loading')).not.toBeInTheDocument();
  });

  it('生成失败：显示友好错误且不新增卡片', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error: '生成失败' }),
      }))
    );
    render(<Harness />);

    fireEvent.change(screen.getByLabelText('画面描述'), {
      target: { value: '雨夜小巷' },
    });
    fireEvent.click(screen.getByText('生成').closest('button'));

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('生成失败')
    );
    expect(screen.queryByTestId('visual-card-asset-1')).not.toBeInTheDocument();
  });

  it('保留结构化提示词预览与复制按钮', () => {
    render(<Harness />);
    expect(screen.getByText('结构化提示词')).toBeInTheDocument();
    expect(screen.getByText('复制提示词')).toBeInTheDocument();
  });
});
