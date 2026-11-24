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
    expect(await screen.findByRole('button', { name: '素材生成' })).toBeInTheDocument();
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

  it('只读演示全程零写入，退出后登录得到干净空白且不持久化演示作品', async () => {
    m.user = null;
    const { container } = render(<App />);

    // 未登录进入只读演示
    fireEvent.click(await screen.findByRole('button', { name: '不登录，先看只读演示' }));
    expect(await screen.findByText('体验用户（只读）')).toBeInTheDocument();

    // 演示期间返回封面
    fireEvent.click(screen.getByRole('button', { name: '返回封面' }));
    expect(await screen.findByRole('button', { name: '一键体验 →' })).toBeInTheDocument();
    // 整个演示流程无任何后端写入
    expect(m.saveProject).not.toHaveBeenCalled();

    // 登录进入工作台
    m.user = { username: 'tester' };
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'tester' } });
    fireEvent.change(container.querySelector('input[type="password"]'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(container.querySelector('button.landing-submit'));

    // 得到干净的素材输入页，而非残留示例
    expect(await screen.findByRole('button', { name: '素材生成' })).toBeInTheDocument();
    // 自动保存即使触发，也绝不写入内置演示 id
    await waitFor(() => {
      const savedIds = m.saveProject.mock.calls.map(([id]) => id);
      expect(savedIds).not.toContain('demo-project');
    });
  });
});
