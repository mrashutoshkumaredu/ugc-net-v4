import { beforeEach, describe, expect, it } from 'vitest';
import { clearProgress, getActiveProgress, loadProgress, saveProgress } from './progress';

const sample = {
  sessionId: 's1',
  label: 'Teaching Aptitude (10 Qs)',
  answers: { 101: 2 },
  reviewFlags: { 102: true },
  currentIndex: 3,
  language: 'EN' as const,
  savedAt: 1,
};

describe('progress', () => {
  beforeEach(() => window.localStorage.clear());

  it('saves and restores answers for a session', () => {
    saveProgress(sample);
    expect(loadProgress('s1')).toEqual(sample);
    expect(getActiveProgress()?.sessionId).toBe('s1');
  });

  it('clears a session after submitting', () => {
    saveProgress(sample);
    clearProgress('s1');
    expect(loadProgress('s1')).toBeNull();
    expect(getActiveProgress()).toBeNull();
  });
});
