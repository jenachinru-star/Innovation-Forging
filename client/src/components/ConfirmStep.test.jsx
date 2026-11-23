import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmStep from './ConfirmStep.jsx';

describe('ConfirmStep', () => {
  it('编辑触发 onChangeScriptText', () => {
    const onChange = vi.fn();
    render(<ConfirmStep scriptText="原文本" onChangeScriptText={onChange} canRegenerate={false} onRegenerate={() => {}} onConfirm={() => {}} busy={false} error="" />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '新文本' } });
    expect(onChange).toHaveBeenCalledWith('新文本');
  });

  it('canRegenerate=false 时不显示重新生成', () => {
    render(<ConfirmStep scriptText="x" onChangeScriptText={() => {}} canRegenerate={false} onRegenerate={() => {}} onConfirm={() => {}} busy={false} error="" />);
    expect(screen.queryByText('重新生成')).toBeNull();
  });

  it('点击确认下一步触发 onConfirm', () => {
    const onConfirm = vi.fn();
    render(<ConfirmStep scriptText="x" onChangeScriptText={() => {}} canRegenerate onRegenerate={() => {}} onConfirm={onConfirm} busy={false} error="" />);
    fireEvent.click(screen.getByText('确认，下一步'));
    expect(onConfirm).toHaveBeenCalled();
  });
});
