import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CharacterGallery from './CharacterGallery.jsx';

const chars = [
  { name: '老陈', description: '退休教师' },
  { name: '老周', description: '老同学' },
];

describe('CharacterGallery', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('渲染人物卡片与生成按钮', () => {
    render(<CharacterGallery characters={chars} />);
    expect(screen.getByText('老陈')).toBeInTheDocument();
    expect(screen.getByText('老周')).toBeInTheDocument();
    expect(screen.getAllByText('生成形象').length).toBe(2);
  });

  it('点击生成形象后展示图片', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ name: '老陈', imageUrl: 'http://img/1.png' }),
    })));
    render(<CharacterGallery characters={[chars[0]]} />);
    fireEvent.click(screen.getByText('生成形象'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const img = await screen.findByAltText('老陈');
    expect(img.getAttribute('src')).toBe('http://img/1.png');
  });
});
