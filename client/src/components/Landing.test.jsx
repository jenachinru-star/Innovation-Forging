import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
}));

vi.mock('../api/auth.js', () => ({
  login: mocks.login,
  register: mocks.register,
}));

import Landing from './Landing.jsx';

function passwordInput(container) {
  return container.querySelector('input[type="password"]');
}

describe('Landing 封面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未登录展示品牌、登录表单与只读演示入口', () => {
    render(<Landing />);
    expect(screen.getByRole('heading', { name: '开排' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '登录' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: /不登录，先看只读演示/ })).toBeInTheDocument();
  });

  it('切换到注册标签', () => {
    render(<Landing />);
    fireEvent.click(screen.getByRole('button', { name: '注册' }));
    expect(screen.getByRole('button', { name: '注册并进入' })).toBeInTheDocument();
  });

  it('点只读演示触发 onTryDemo', () => {
    const onTryDemo = vi.fn();
    render(<Landing onTryDemo={onTryDemo} />);
    fireEvent.click(screen.getByRole('button', { name: '不登录，先看只读演示' }));
    expect(onTryDemo).toHaveBeenCalledTimes(1);
  });

  it('登录失败显示错误且不触发 onAuth', async () => {
    mocks.login.mockRejectedValueOnce(new Error('用户名或密码不正确'));
    const onAuth = vi.fn();
    const { container } = render(<Landing onAuth={onAuth} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ghost' } });
    fireEvent.change(passwordInput(container), { target: { value: 'wrongpass' } });
    fireEvent.click(container.querySelector('button.landing-submit'));
    expect(await screen.findByRole('alert')).toHaveTextContent('用户名或密码不正确');
    expect(onAuth).not.toHaveBeenCalled();
  });

  it('注册成功后调用 onAuth', async () => {
    mocks.register.mockResolvedValueOnce({});
    const onAuth = vi.fn(async () => {});
    const { container } = render(<Landing onAuth={onAuth} />);
    fireEvent.click(screen.getByRole('button', { name: '注册' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'newdirector' } });
    fireEvent.change(passwordInput(container), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: '注册并进入' }));
    await waitFor(() => expect(onAuth).toHaveBeenCalledTimes(1));
  });

  it('已登录时显示进入工作台与退出并响应回调', () => {
    const onResume = vi.fn();
    const onLogout = vi.fn();
    render(<Landing user={{ username: 'tester' }} onResume={onResume} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole('button', { name: /^进入工作台$/ }));
    expect(onResume).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '退出登录' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
