import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.jsx';

describe('App', () => {
  it('初始渲染素材输入步骤', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: '素材生成' })).toBeInTheDocument();
  });

  it('点击剧本版本对照进入版本对照页', () => {
    render(<App />);
    fireEvent.click(screen.getByText('剧本版本对照'));
    expect(screen.getByText('旧版本（上传）')).toBeInTheDocument();
  });
});
