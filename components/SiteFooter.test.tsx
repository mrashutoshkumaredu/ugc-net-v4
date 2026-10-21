import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SiteFooter from './SiteFooter';

const path = vi.hoisted(() => ({ value: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => path.value }));

describe('SiteFooter', () => {
  it('shows the independence disclaimer and the maintainer credit', () => {
    path.value = '/practice';
    render(<SiteFooter />);
    const note = screen.getByRole('note');
    expect(note.textContent).toMatch(/independent site/i);
    expect(note.textContent).toMatch(/not affiliated with UGC, NTA or the Government of India/i);
    expect(note.textContent).toMatch(/no official logos or emblems/i);
    expect(screen.getByText(/Ashutosh Kumar/)).toBeTruthy();
  });

  it('renders nothing during a test, so test screens are unchanged', () => {
    path.value = '/quiz';
    const { container } = render(<SiteFooter />);
    expect(container.firstChild).toBeNull();
  });
});
