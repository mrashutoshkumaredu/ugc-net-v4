import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WelcomeGuide from './WelcomeGuide';
import { OPEN_GUIDE_EVENT, WELCOME_SEEN_KEY } from '@/lib/welcome';

const path = vi.hoisted(() => ({ value: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => path.value }));

beforeEach(() => { localStorage.clear(); path.value = '/'; });

describe('WelcomeGuide', () => {
  it('opens for a first-time visitor on the home page and names the sections', () => {
    render(<WelcomeGuide />);
    expect(screen.getByRole('dialog', { name: /welcome/i })).toBeTruthy();
    for (const name of ['Today', 'Practice', 'Learn', 'Progress']) expect(screen.getByText(`${name}.`)).toBeTruthy();
  });

  it('closes with "Got it" and does not come back on the next visit', async () => {
    const { unmount } = render(<WelcomeGuide />);
    await userEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem(WELCOME_SEEN_KEY)).toBe('1');
    unmount();
    render(<WelcomeGuide />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes with Escape', async () => {
    render(<WelcomeGuide />);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('stays away from tests, admin and other pages', () => {
    for (const p of ['/quiz', '/admin', '/reset-password', '/contact']) {
      path.value = p;
      const { unmount } = render(<WelcomeGuide />);
      expect(screen.queryByRole('dialog')).toBeNull();
      unmount();
    }
  });

  it('can be reopened from the footer link even after it was seen', () => {
    localStorage.setItem(WELCOME_SEEN_KEY, '1');
    path.value = '/contact';
    render(<WelcomeGuide />);
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => { window.dispatchEvent(new Event(OPEN_GUIDE_EVENT)); });
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
