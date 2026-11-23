import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmStep from './ConfirmStep.jsx';

function baseProps(over = {}) {
  return {
    scriptText: '原文本',
    onChangeScriptText: vi.fn(),
    canRegenerate: false,
    onRegenerate: vi.fn(),
    onConfirm: vi.fn(),
    busy: false,
    error: '',
    ...over,
  };
}

describe('ConfirmStep', () => {
  it('编辑触发 onChangeScriptText', () => {
    const onChange = vi.fn();
    render(<ConfirmStep {...baseProps({ onChangeScriptText: onChange })} />);
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '新文本' } });
    expect(onChange).toHaveBeenCalledWith('新文本');
  });

  it('canRegenerate=false 时不显示重新生成', () => {
    render(<ConfirmStep {...baseProps({ canRegenerate: false })} />);
    expect(screen.queryByText('重新生成')).toBeNull();
  });

  it('点击确认下一步触发 onConfirm', () => {
    const onConfirm = vi.fn();
    render(<ConfirmStep {...baseProps({ canRegenerate: true, onConfirm })} />);
    fireEvent.click(screen.getByText('确认，下一步'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('合并别名后出现提示文本，确认回传 aliasMap', () => {
    const onConfirm = vi.fn();
    render(<ConfirmStep {...baseProps({ scriptText: '王大爷来了', onConfirm })} />);
    fireEvent.change(screen.getByLabelText('规范名'), { target: { value: '老王' } });
    fireEvent.change(screen.getByLabelText('别名'), { target: { value: '王大爷' } });
    fireEvent.click(screen.getByText('合并人物'));
    expect(screen.getByText('已将「王大爷」合并为「老王」')).toBeInTheDocument();
    fireEvent.click(screen.getByText('确认，下一步'));
    expect(onConfirm).toHaveBeenCalledWith({ aliasMap: { 王大爷: '老王' } });
  });

  it('未做任何合并时确认回传空 aliasMap', () => {
    const onConfirm = vi.fn();
    render(<ConfirmStep {...baseProps({ onConfirm })} />);
    fireEvent.click(screen.getByText('确认，下一步'));
    expect(onConfirm).toHaveBeenCalledWith({ aliasMap: {} });
  });
});
