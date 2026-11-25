import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReviewTemplate from './ReviewTemplate.jsx';

describe('ReviewTemplate', () => {
  it('渲染五个复盘字段', () => {
    render(<ReviewTemplate plan={{}} dispatch={() => {}} />);

    for (const label of ['本次目标', '做得好的', '待改进', '下次行动', '结论']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it('填写后保存派发 setReview，含全部字段', () => {
    const dispatch = vi.fn();
    render(<ReviewTemplate plan={{}} dispatch={dispatch} />);

    fireEvent.change(screen.getByLabelText('本次目标'), {
      target: { value: '走完开场走位' },
    });
    fireEvent.change(screen.getByLabelText('待改进'), {
      target: { value: '灯光切换偏慢' },
    });
    fireEvent.click(screen.getByText('保存复盘'));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'setReview',
      payload: expect.objectContaining({
        goal: '走完开场走位',
        improve: '灯光切换偏慢',
      }),
    });
    expect(screen.getByTestId('review-saved')).toBeInTheDocument();
  });

  it('从 plan.review 回填已保存内容', () => {
    render(
      <ReviewTemplate
        plan={{ review: { goal: '已有目标', conclusion: '已有结论' } }}
        dispatch={() => {}}
      />
    );

    expect(screen.getByLabelText('本次目标').value).toBe('已有目标');
    expect(screen.getByLabelText('结论').value).toBe('已有结论');
  });
});
