import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ReferencePanel from './ReferencePanel';

vi.mock('next/dynamic', () => ({ default: () => () => <div data-testid="ref-text" /> }));

describe('ReferencePanel', () => {
  it('offers an Expand button that asks to go full screen', () => {
    const onToggle = vi.fn();
    render(<ReferencePanel layoutText="<p>Table</p>" onToggleExpand={onToggle} />);
    const btn = screen.getByRole('button', { name: /expand the reference material/i });
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('when expanded, shows Back to question and the question number, and fills the area', () => {
    const { container } = render(<ReferencePanel layoutText="<p>Table</p>" expanded onToggleExpand={() => {}} questionLabel="Question 3 of 50" />);
    expect(screen.getByRole('button', { name: /back to the question/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Question 3 of 50')).toBeTruthy();
    expect((container.firstChild as HTMLElement).className).toMatch(/flex-1 h-full w-full/);
  });

  it('takes 40% of the height on phones in split view', () => {
    const { container } = render(<ReferencePanel layoutText="<p>Table</p>" />);
    expect((container.firstChild as HTMLElement).className).toMatch(/\bh-2\/5\b/);
  });
});
