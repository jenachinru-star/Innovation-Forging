import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ConfirmStep from './ConfirmStep.jsx';
import { SAMPLE_TEXT } from '@director/shared/samples/oneAct.js';

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

function Controlled({ initial = '原文本', extra = {} }) {
  const [text, setText] = useState(initial);
  return (
    <ConfirmStep
      {...baseProps({
        scriptText: text,
        onChangeScriptText: setText,
        ...extra,
      })}
    />
  );
}

const editor = () => screen.getByRole('textbox', { name: '剧本编辑器' });

describe('ConfirmStep', () => {
  it('编辑触发 onChangeScriptText', () => {
    const onChange = vi.fn();
    render(<ConfirmStep {...baseProps({ onChangeScriptText: onChange })} />);
    fireEvent.change(editor(), { target: { value: '新文本' } });
    expect(onChange).toHaveBeenCalledWith('新文本');
  });

  it('canRegenerate=false 时不显示重新生成', () => {
    render(<ConfirmStep {...baseProps({ canRegenerate: false })} />);
    expect(screen.queryByText('重新生成')).toBeNull();
  });

  it('点击确认触发 onConfirm', () => {
    const onConfirm = vi.fn();
    render(<ConfirmStep {...baseProps({ canRegenerate: true, onConfirm })} />);
    fireEvent.click(screen.getByText('没问题，开始排'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('合并别名后出现提示，确认回传 aliasMap', () => {
    const onConfirm = vi.fn();
    render(<ConfirmStep {...baseProps({ scriptText: '王大爷来了', onConfirm })} />);
    fireEvent.change(screen.getByLabelText('规范名'), { target: { value: '老王' } });
    fireEvent.change(screen.getByLabelText('别名'), { target: { value: '王大爷' } });
    fireEvent.click(screen.getByText('合并人物'));
    expect(screen.getByText('已将「王大爷」合并为「老王」')).toBeInTheDocument();
    fireEvent.click(screen.getByText('没问题，开始排'));
    expect(onConfirm).toHaveBeenCalledWith({ aliasMap: { 王大爷: '老王' } });
  });

  it('未合并时确认回传空 aliasMap', () => {
    const onConfirm = vi.fn();
    render(<ConfirmStep {...baseProps({ onConfirm })} />);
    fireEvent.click(screen.getByText('没问题，开始排'));
    expect(onConfirm).toHaveBeenCalledWith({ aliasMap: {} });
  });

  it('渲染幕/场/说明/对白四个元素按钮', () => {
    render(<ConfirmStep {...baseProps()} />);
    for (const name of ['幕', '场', '说明', '对白']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('点击对白插入对白片段', () => {
    const onChange = vi.fn();
    render(<ConfirmStep {...baseProps({ onChangeScriptText: onChange })} />);
    fireEvent.click(screen.getByRole('button', { name: '对白' }));
    expect(onChange.mock.calls[0][0]).toContain('人物：');
  });

  it('连续插入幕自动递增编号', () => {
    render(<Controlled initial="" />);
    fireEvent.click(screen.getByRole('button', { name: '幕' }));
    fireEvent.click(screen.getByRole('button', { name: '幕' }));
    expect(editor()).toHaveValue('第一幕\n第二幕\n');
  });

  it('撤销与重做按历史栈恢复', () => {
    render(<Controlled initial="原文本" />);
    const undoBtn = screen.getByRole('button', { name: '撤销' });
    const redoBtn = screen.getByRole('button', { name: '重做' });
    expect(undoBtn).toBeDisabled();
    fireEvent.change(editor(), { target: { value: '新文本' } });
    expect(undoBtn).not.toBeDisabled();
    fireEvent.click(undoBtn);
    expect(editor()).toHaveValue('原文本');
    fireEvent.click(redoBtn);
    expect(editor()).toHaveValue('新文本');
  });

  it('查找统计匹配并可切换', () => {
    render(<Controlled initial="老陈来了，老陈走了" />);
    fireEvent.click(screen.getByRole('button', { name: '查找' }));
    fireEvent.change(screen.getByLabelText('查找内容'), { target: { value: '老陈' } });
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '下一个匹配' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '关闭查找' }));
    expect(screen.queryByLabelText('查找内容')).toBeNull();
  });

  it('引导条显示并可关闭', () => {
    render(<ConfirmStep {...baseProps()} />);
    expect(screen.getByText(/剧本可以/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '关闭引导' }));
    expect(screen.queryByText(/剧本可以/)).toBeNull();
  });

  it('加台词菜单选角色后插入对白', () => {
    render(<Controlled initial={SAMPLE_TEXT} />);
    fireEvent.click(screen.getByRole('button', { name: '＋加台词' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '老陈' }));
    expect(editor().value).toContain('老陈：');
  });

  it('点击行类型色块可把该行改成说明', () => {
    render(<Controlled initial="原文本" />);
    const dots = document.querySelectorAll('.cf-type-dot');
    expect(dots.length).toBe(1);
    fireEvent.click(dots[0]);
    expect(screen.getByRole('menu', { name: '修改这行的类型' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: '说明' }));
    expect(editor()).toHaveValue('（原文本）');
  });

  it('全部替换生效', () => {
    render(<Controlled initial="老陈和老陈" />);
    fireEvent.click(screen.getByRole('button', { name: '查找' }));
    fireEvent.change(screen.getByLabelText('查找内容'), { target: { value: '老陈' } });
    fireEvent.click(screen.getByRole('button', { name: '展开替换' }));
    fireEvent.change(screen.getByLabelText('替换为'), { target: { value: '老周' } });
    fireEvent.click(screen.getByRole('button', { name: '全部替换' }));
    expect(editor()).toHaveValue('老周和老周');
  });

  it('信息页头渲染状态徽章与四个统计标签', () => {
    render(<ConfirmStep {...baseProps()} />);
    const hero = document.querySelector('.cf2-hero');
    expect(within(hero).getByText('校对中')).toBeInTheDocument();
    expect(within(hero).getByText('SCRIPT & VERSIONS · 01')).toBeInTheDocument();
    for (const label of ['场次', '角色', '字数', '时长']) {
      expect(within(hero).getByText(label)).toBeInTheDocument();
    }
  });

  it('角色名单渲染戏份占比条且带宽度', () => {
    render(<Controlled initial={SAMPLE_TEXT} />);
    const fills = document.querySelectorAll('.cf-roster-bar-fill');
    expect(fills.length).toBeGreaterThan(0);
    for (const fill of fills) {
      expect(fill.style.width).not.toBe('');
    }
  });

  it('编辑器底部统计行数', () => {
    render(<Controlled initial={'第一行\n第二行'} />);
    expect(screen.getByText('2 行')).toBeInTheDocument();
  });
});
