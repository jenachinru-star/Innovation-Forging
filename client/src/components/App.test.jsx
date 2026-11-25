import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const m = vi.hoisted(() => ({
  user: { username: 'tester' },
  saveProject: vi.fn(async () => ({})),
  listProjects: vi.fn(async () => []),
  login: vi.fn(async () => ({})),
}));

vi.mock('../api/auth.js', () => ({
  currentUser: vi.fn(async () => m.user),
  login: (...args) => m.login(...args),
  logout: vi.fn(async () => {}),
}));

vi.mock('../api/projects.js', () => ({
  listProjects: (...args) => m.listProjects(...args),
  getProject: vi.fn(async () => null),
  saveProject: (...args) => m.saveProject(...args),
  removeProject: vi.fn(async () => {}),
}));

import App from '../App.jsx';

describe('App 工作台', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.user = { username: 'tester' };
  });

  it('登录后无作品时渲染素材输入步骤', async () => {
    render(<App />);
    expect(await screen.findByRole('button', { name: /AI 生成/ })).toBeInTheDocument();
  });

  it('点击剧本版本对照进入版本对照页', async () => {
    render(<App />);
    fireEvent.click(await screen.findByText('剧本版本对照'));
    expect(await screen.findByText('旧版本（上传）')).toBeInTheDocument();
  });

  it('根容器使用剧场主题', async () => {
    const { container } = render(<App />);
    await waitFor(() => {
      expect(container.firstChild).toHaveAttribute('data-theme', 'theatre');
    });
  });
});
