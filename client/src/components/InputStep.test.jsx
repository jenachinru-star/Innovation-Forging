import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../api.js', () => ({
  generateScript: vi.fn(),
  extractUpload: vi.fn(),
}));

import { generateScript } from '../api.js';
import InputStep from './InputStep.jsx';

function baseProps(over = {}) {
  return {
    onReady: vi.fn(),
    busy: false,
    setBusy: vi.fn(),
    error: '',
    setError: vi.fn(),
    ...over,
  };
}

describe('InputStep', () => {
  beforeEach(() => vi.clearAllMocks());

  it('点击示例素材填入文本', () => {
    render(<InputStep {...baseProps()} />);
    fireEvent.click(screen.getByText('填入示例素材'));
    const ta = screen.getByPlaceholderText(/输入/);
    expect(ta.value.length).toBeGreaterThan(10);
  });

  it('生成成功回调 onReady（mode=generate）', async () => {
    generateScript.mockResolvedValue({ scriptText: '第一场' });
    const props = baseProps();
    render(<InputStep {...props} />);
    fireEvent.change(screen.getByPlaceholderText(/输入/), { target: { value: '素材内容' } });
    fireEvent.click(screen.getByText('生成剧本'));
    await waitFor(() => expect(props.onReady).toHaveBeenCalled());
    expect(props.onReady.mock.calls[0][0]).toMatchObject({ scriptText: '第一场', mode: 'generate' });
  });

  it('需要澄清时显示 AI 追问，不跳转', async () => {
    generateScript.mockResolvedValue({ needMoreInfo: true, error: '请补充人物名字' });
    const props = baseProps();
    render(<InputStep {...props} />);
    fireEvent.change(screen.getByPlaceholderText(/输入/), { target: { value: '太短' } });
    fireEvent.click(screen.getByText('生成剧本'));
    await waitFor(() => expect(screen.getByText(/请补充人物名字/)).toBeInTheDocument());
    expect(props.onReady).not.toHaveBeenCalled();
  });

  it('点击剧本版本对照调用 onOpenCompare', () => {
    const onOpenCompare = vi.fn();
    render(<InputStep {...baseProps({ onOpenCompare })} />);
    fireEvent.click(screen.getByText('剧本版本对照'));
    expect(onOpenCompare).toHaveBeenCalledTimes(1);
  });

  it('未提供 onOpenCompare 时不显示入口', () => {
    render(<InputStep {...baseProps()} />);
    expect(screen.queryByText('剧本版本对照')).not.toBeInTheDocument();
  });
});
