import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App.jsx';

describe('App', () => {
  it('初始渲染素材输入步骤', () => {
    render(<App />);
    expect(screen.getByText(/素材生成|上传剧本/)).toBeInTheDocument();
  });
});
