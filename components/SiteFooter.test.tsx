import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SiteFooter from './SiteFooter';

const path = vi.hoisted(() => ({ value: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => path.value }));

describe('SiteFooter', () => {
  it('is one slim line linking to the disclaimer, about, contact and the guide', () => {
    path.value = '/practice';
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: 'Disclaimer' }).getAttribute('href')).toBe('/disclaimer');
    expect(screen.getByRole('link', { name: 'About' }).getAttribute('href')).toBe('/about');
    expect(screen.getByRole('link', { name: 'Contact us' }).getAttribute('href')).toBe('/contact');
    expect(screen.getByRole('button', { name: 'How to use this site' })).toBeTruthy();
    // The long disclaimer and the maintainer credit now live on their own pages.
    expect(screen.queryByRole('note')).toBeNull();
    expect(screen.queryByText(/Ashutosh Kumar/)).toBeNull();
  });

  it('renders nothing during a test, so test screens are unchanged', () => {
    path.value = '/quiz';
    const { container } = render(<SiteFooter />);
    expect(container.firstChild).toBeNull();
  });
});
