import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaletteDrawer from './PaletteDrawer';

describe('PaletteDrawer', () => {
  it('marks the current question with the current-state color, not answered/review', () => {
    render(
      <PaletteDrawer
        totalQuestions={3}
        currentIndex={1}
        answeredFlags={[true, false, false]}
        reviewFlags={[false, false, true]}
        onSelect={() => {}}
        onClose={() => {}}
        onSubmit={() => {}}
        isSubmitted={false}
      />
    );
    const current = screen.getByRole('button', { name: '2' });
    expect(current.className).toContain('bg-indigo-600');
  });

  it('prioritizes review over answered styling', () => {
    render(
      <PaletteDrawer
        totalQuestions={1}
        currentIndex={-1}
        answeredFlags={[true]}
        reviewFlags={[true]}
        onSelect={() => {}}
        onClose={() => {}}
        onSubmit={() => {}}
        isSubmitted={false}
      />
    );
    const btn = screen.getByRole('button', { name: '1' });
    expect(btn.className).toContain('bg-amber-400');
    expect(btn.className).not.toContain('bg-emerald-500');
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
});
