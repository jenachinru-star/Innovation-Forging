import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  function pickFile(container, content) {
    const input = container.querySelector('input[type="file"]');
    const file = new File([content], 'a.kaipai.json', { type: 'application/json' });
    file.text = () => Promise.resolve(content);
    fireEvent.change(input, { target: { files: [file] } });
  }

  it('导入成功后才提示已导入', async () => {
    const props = baseProps({ onImport: vi.fn().mockResolvedValue(undefined) });
    const { container } = render(<ProjectLibrary {...props} />);
    pickFile(container, JSON.stringify({ project: { name: '雨夜' } }));
    expect(await screen.findByText('已导入「雨夜」')).toBeInTheDocument();
    expect(props.onImport).toHaveBeenCalledWith({ name: '雨夜' });
  });

  it('导入被服务端拒绝时提示失败，不显示已导入', async () => {
    const props = baseProps({ onImport: vi.fn().mockRejectedValue(new Error('请求内容过大')) });
    const { container } = render(<ProjectLibrary {...props} />);
    pickFile(container, JSON.stringify({ name: '坏档' }));
    expect(await screen.findByText('导入失败：请求内容过大')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/已导入/)).toBeNull());
  });
});
