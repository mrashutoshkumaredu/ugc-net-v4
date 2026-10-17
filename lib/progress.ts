// Saves an in-progress test on the student's own device so a refresh, a
// closed tab or the back button doesn't lose their answers. The test
// session itself (questions, start time) lives in the database; this only
// keeps what the student has done so far. Storage can be unavailable
// (private browsing, blocked site data), so every access is guarded.

export type SavedProgress = {
  sessionId: string;
  label: string;
  answers: Record<number, number>;
  reviewFlags: Record<number, boolean>;
  currentIndex: number;
  language: 'EN' | 'HI';
  savedAt: number;
};

const ACTIVE_KEY = 'ugcnet.activeSession';
const progressKey = (sessionId: string) => `ugcnet.progress.${sessionId}`;

export function saveProgress(p: SavedProgress) {
  try {
    window.localStorage.setItem(progressKey(p.sessionId), JSON.stringify(p));
    window.localStorage.setItem(ACTIVE_KEY, p.sessionId);
  } catch {
    // storage unavailable — the test still works, it just can't resume
  }
}

export function loadProgress(sessionId: string): SavedProgress | null {
  try {
    const raw = window.localStorage.getItem(progressKey(sessionId));
    return raw ? (JSON.parse(raw) as SavedProgress) : null;
  } catch {
    return null;
  }
}

export function getActiveProgress(): SavedProgress | null {
  try {
    const id = window.localStorage.getItem(ACTIVE_KEY);
    return id ? loadProgress(id) : null;
  } catch {
    return null;
  }
}

export function clearProgress(sessionId: string) {
  try {
    window.localStorage.removeItem(progressKey(sessionId));
    if (window.localStorage.getItem(ACTIVE_KEY) === sessionId) {
      window.localStorage.removeItem(ACTIVE_KEY);
    }
  } catch {
    // ignore
  }
}
