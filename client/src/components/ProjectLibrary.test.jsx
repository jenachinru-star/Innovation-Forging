import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ProjectLibrary from './ProjectLibrary.jsx';

function baseProps(overrides = {}) {
  return {
    open: true,
    projects: [
      {
        id: 'p-1',
        name: '钥匙',
        summary: '父女重逢',
        sceneCount: 3,
        status: '排演中',
        updatedAt: '2026-11-24T10:00:00.000Z',
      },
    ],
    currentId: '',
    onClose: vi.fn(),
    onCreate: vi.fn(),
    onOpen: vi.fn(),
    onImport: vi.fn(),
    onExport: vi.fn(),
    onDelete: vi.fn(),
    onDuplicate: vi.fn(),
    ...overrides,
  };
}

describe('ProjectLibrary', () => {
  it('展示本地作品并可打开', () => {
    const props = baseProps();
    render(<ProjectLibrary {...props} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('钥匙')).toBeInTheDocument();
    fireEvent.click(screen.getByText('钥匙'));
    expect(props.onOpen).toHaveBeenCalledWith('p-1');
  });

  it('新建作品与关闭动作可用', () => {
    const props = baseProps();
    render(<ProjectLibrary {...props} />);
    fireEvent.click(screen.getByRole('button', { name: '新建作品' }));
    expect(props.onCreate).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '关闭作品库' }));
    expect(props.onClose).toHaveBeenCalled();
  });
});
