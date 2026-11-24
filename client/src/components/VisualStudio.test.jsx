import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VisualStudio from './VisualStudio.jsx';
import { DIRECTOR_STYLES, STYLE_FAMILIES } from '../data/styles.js';

const data = {
  characters: [{ id: 'ch-1', name: '老陈', description: '退休教师' }],
};

describe('VisualStudio', () => {
  it('首版风格库包含 10 个视觉族和 24 位精选导演', () => {
    expect(STYLE_FAMILIES).toHaveLength(10);
    expect(DIRECTOR_STYLES).toHaveLength(24);
  });

  it('展示 10 个视觉族并可选择导演', () => {
    render(<VisualStudio scriptData={data} plan={{}} dispatch={() => {}} />);
    expect(screen.getByText('冷调惊悚')).toBeInTheDocument();
    expect(screen.getByText('东方留白')).toBeInTheDocument();
    fireEvent.click(screen.getByText('希区柯克'));
    expect(screen.getAllByText(/优雅中性色/).length).toBeGreaterThan(0);
  });

  it('应用风格时写入结构化提示词和目标', () => {
    const dispatch = vi.fn();
    render(<VisualStudio scriptData={data} plan={{}} dispatch={dispatch} />);
    fireEvent.click(screen.getByText('希区柯克'));
    fireEvent.click(screen.getByRole('button', { name: '应用到作品' }));
    const action = dispatch.mock.calls[0][0];
    expect(action.type).toBe('setStyle');
    expect(action.style.directorId).toBe('alfred-hitchcock');
    expect(action.style.prompt).toContain('色彩结构');
    expect(action.style.prompt).toContain('老陈');
  });

  it('可切换生成目标并更新提示词', () => {
    render(<VisualStudio scriptData={data} plan={{}} dispatch={() => {}} />);
    fireEvent.click(screen.getByText('场景概念图'));
    expect(screen.getAllByText('场景概念图').length).toBeGreaterThan(1);
  });
});
