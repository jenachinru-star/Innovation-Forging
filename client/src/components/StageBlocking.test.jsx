import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StageBlocking from './StageBlocking.jsx';

describe('StageBlocking', () => {
  it('渲染出场人物名称', () => {
    render(<StageBlocking characters={['老陈', '老周']} />);
    expect(screen.getByText('老陈')).toBeInTheDocument();
    expect(screen.getByText('老周')).toBeInTheDocument();
  });

  it('点击下一走位后仍正常显示人物', () => {
    render(<StageBlocking characters={['老陈', '老周']} />);
    fireEvent.click(screen.getByText('下一走位'));
    expect(screen.getByText('老陈')).toBeInTheDocument();
    expect(screen.getByText('老周')).toBeInTheDocument();
  });
});
