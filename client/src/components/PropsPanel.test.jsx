import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PropsPanel from './PropsPanel.jsx';

describe('PropsPanel 道具清单', () => {
  it('按场次展示道具', () => {
    const scriptData = {
      scenes: [
        { id: 'sc-1', sceneNumber: 1, title: '第一场', props: ['雨伞'] },
        { id: 'sc-2', sceneNumber: 2, title: '第二场', props: [] },
      ],
    };
    render(<PropsPanel scriptData={scriptData} />);
    expect(screen.getByText('第一场')).toBeInTheDocument();
    expect(screen.getByText('雨伞')).toBeInTheDocument();
    expect(screen.getByText('暂无道具。')).toBeInTheDocument();
  });

  it('添加道具调用 onChangeScene', () => {
    const onChangeScene = vi.fn();
    const scriptData = {
      scenes: [{ id: 'sc-1', sceneNumber: 1, title: '第一场', props: [] }],
    };
    render(<PropsPanel scriptData={scriptData} onChangeScene={onChangeScene} />);
    const input = screen.getByLabelText(/为 第一场 新增道具/);
    fireEvent.change(input, { target: { value: '信' } });
    fireEvent.click(screen.getByRole('button', { name: '添加' }));
    expect(onChangeScene).toHaveBeenCalledWith(0, { props: ['信'] });
  });

  it('删除道具调用 onChangeScene', () => {
    const onChangeScene = vi.fn();
    const scriptData = {
      scenes: [{ id: 'sc-1', sceneNumber: 1, title: '第一场', props: ['雨伞', '信'] }],
    };
    render(<PropsPanel scriptData={scriptData} onChangeScene={onChangeScene} />);
    fireEvent.click(screen.getByLabelText('删除道具 雨伞'));
    expect(onChangeScene).toHaveBeenCalledWith(0, { props: ['信'] });
  });
});