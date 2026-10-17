import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaletteDrawer from './PaletteDrawer';

describe('PaletteDrawer', () => {
  it('marks the current question with a ring and keeps its NTA status colour', () => {
    render(
      <PaletteDrawer
        totalQuestions={3}
        currentIndex={1}
        answeredFlags={[true, false, false]}
        reviewFlags={[false, false, true]}
        visitedFlags={[true, true, false]}
        onSelect={() => {}}
        onClose={() => {}}
        onSubmit={() => {}}
        isSubmitted={false}
      />
    );
    const current = screen.getByRole('button', { name: '2' });
    expect(current.className).toContain('ring-2');
    expect(current.className).toContain('bg-rose-600'); // visited, not answered
    expect(screen.getByRole('button', { name: '1' }).className).toContain('bg-emerald-600');
  });

  it('uses NTA colours: not visited, marked, answered & marked', () => {
    render(
      <PaletteDrawer
        totalQuestions={3}
        currentIndex={-1}
        answeredFlags={[false, false, true]}
        reviewFlags={[false, true, true]}
        visitedFlags={[false, true, true]}
        onSelect={() => {}}
        onClose={() => {}}
        onSubmit={() => {}}
        isSubmitted={false}
      />
    );
    expect(screen.getByRole('button', { name: '1' }).className).toContain('bg-slate-100');
    expect(screen.getByRole('button', { name: '2' }).className).toContain('bg-violet-700');
    const both = screen.getByRole('button', { name: '3' });
    expect(both.className).toContain('bg-violet-700');
    expect(both.querySelector('span')).not.toBeNull(); // green tick dot
  });

  it('calls onSelect with the clicked question index', async () => {
    const onSelect = vi.fn();
    render(
      <PaletteDrawer
        totalQuestions={2}
        currentIndex={0}
        answeredFlags={[false, false]}
        reviewFlags={[false, false]}
        onSelect={onSelect}
        onClose={() => {}}
        onSubmit={() => {}}
        isSubmitted={false}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('calls onSubmit when the final submit button is clicked', async () => {
    const onSubmit = vi.fn();
    render(
      <PaletteDrawer
        totalQuestions={1}
        currentIndex={0}
        answeredFlags={[true]}
        reviewFlags={[false]}
        onSelect={() => {}}
        onClose={() => {}}
        onSubmit={onSubmit}
        isSubmitted={false}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /submit final test/i }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('hides the submit button once the test is submitted', () => {
    render(
      <PaletteDrawer
        totalQuestions={1}
        currentIndex={0}
        answeredFlags={[true]}
        reviewFlags={[false]}
        onSelect={() => {}}
        onClose={() => {}}
        onSubmit={() => {}}
        isSubmitted={true}
      />
    );
    expect(screen.queryByRole('button', { name: /submit final test/i })).not.toBeInTheDocument();
  });

  it('after submitting, colours wrong answers red and filters to them', async () => {
    const onFilterChange = vi.fn();
    const { rerender } = render(
      <PaletteDrawer
        totalQuestions={3}
        currentIndex={-1}
        answeredFlags={[true, true, false]}
        reviewFlags={[false, false, false]}
        onSelect={() => {}}
        onClose={() => {}}
        onSubmit={() => {}}
        isSubmitted={true}
        resultStates={['correct', 'wrong', 'skipped']}
        filter="ALL"
        onFilterChange={onFilterChange}
      />
    );
    expect(screen.getByRole('button', { name: '2' }).className).toContain('bg-rose-500');
    await userEvent.click(screen.getByRole('button', { name: 'Wrong' }));
    expect(onFilterChange).toHaveBeenCalledWith('WRONG');

    rerender(
      <PaletteDrawer
        totalQuestions={3}
        currentIndex={-1}
        answeredFlags={[true, true, false]}
        reviewFlags={[false, false, false]}
        onSelect={() => {}}
        onClose={() => {}}
        onSubmit={() => {}}
        isSubmitted={true}
        resultStates={['correct', 'wrong', 'skipped']}
        filter="WRONG"
        onFilterChange={onFilterChange}
      />
    );
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
  });
});
