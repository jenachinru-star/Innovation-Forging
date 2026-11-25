import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CollectionPanel, { isLink } from './CollectionPanel.jsx';

describe('CollectionPanel', () => {
  it('输入文本点收藏派发 addCollection 并清空输入', () => {
    const dispatch = vi.fn();
    render(<CollectionPanel plan={{}} dispatch={dispatch} />);

    const input = screen.getByLabelText('收藏内容');
    fireEvent.change(input, { target: { value: '参考：暖棕色卡' } });
    fireEvent.click(screen.getByText('收藏'));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'addCollection',
      text: '参考：暖棕色卡',
    });
    expect(screen.getByLabelText('收藏内容').value).toBe('');
  });

  it('回车也能触发收藏', () => {
    const dispatch = vi.fn();
    render(<CollectionPanel plan={{}} dispatch={dispatch} />);

    fireEvent.change(screen.getByLabelText('收藏内容'), {
      target: { value: '随手备注' },
    });
    fireEvent.keyDown(screen.getByLabelText('收藏内容'), { key: 'Enter' });

    expect(dispatch).toHaveBeenCalledWith({
      type: 'addCollection',
      text: '随手备注',
    });
  });

  it('渲染已收藏条目并可删除', () => {
    const dispatch = vi.fn();
    const plan = {
      collections: [
        { id: 'coll-1', text: '第一条备注', createdAt: '2026-11-25T10:00:00Z' },
      ],
    };
    render(<CollectionPanel plan={plan} dispatch={dispatch} />);

    expect(screen.getByText('第一条备注')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('删除收藏'));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'removeCollection',
      id: 'coll-1',
    });
  });

  it('链接文本渲染为可点击链接', () => {
    const plan = {
      collections: [
        { id: 'coll-1', text: 'https://example.com/ref', createdAt: '' },
      ],
    };
    render(<CollectionPanel plan={plan} dispatch={() => {}} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/ref');
    expect(link).toHaveAttribute('target', '_blank');
  });
});

describe('isLink', () => {
  it('识别 http 与 https 链接', () => {
    expect(isLink('https://a.com')).toBe(true);
    expect(isLink('http://a.com')).toBe(true);
    expect(isLink('普通备注')).toBe(false);
    expect(isLink('')).toBe(false);
  });
});
