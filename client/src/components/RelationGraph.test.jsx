import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RelationGraph from './RelationGraph.jsx';

describe('RelationGraph', () => {
  it('无关系时显示提示语', () => {
    render(<RelationGraph scriptData={{ characters: [{ name: '甲' }], relationships: [] }} />);
    expect(screen.getByText(/暂无足够的人物关系信息/)).toBeInTheDocument();
  });
});
