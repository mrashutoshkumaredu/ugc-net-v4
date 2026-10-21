// First-visit guide. Remembered in this browser only, so a new device or cleared data shows it again.
export const WELCOME_SEEN_KEY = 'ugcnet.welcomeSeen.v1';
export const OPEN_GUIDE_EVENT = 'open-welcome-guide';

// Pages where a first-time visitor sees the guide automatically. Never during a test,
// on admin pages or on the password-reset page.
export const WELCOME_AUTO_PATHS = ['/', '/practice', '/learn'];

export function hasSeenWelcome(): boolean {
  try { return localStorage.getItem(WELCOME_SEEN_KEY) === '1'; } catch { return false; }
}
export function markWelcomeSeen(): void {
  try { localStorage.setItem(WELCOME_SEEN_KEY, '1'); } catch { /* private mode: it will simply show again */ }
}

// Language of the guide: English or Hindi. Remembered in this browser only.
export type GuideLang = 'en' | 'hi';
export const GUIDE_LANG_KEY = 'ugcnet.guideLang.v1';
export function getGuideLang(): GuideLang {
  try { return localStorage.getItem(GUIDE_LANG_KEY) === 'hi' ? 'hi' : 'en'; } catch { return 'en'; }
}
export function setGuideLang(lang: GuideLang): void {
  try { localStorage.setItem(GUIDE_LANG_KEY, lang); } catch { /* not remembered, still works */ }
}
