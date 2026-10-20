// The password rule for new and changed passwords. Keep it the same as the
// Supabase dashboard setting (Authentication > Email): at least 8 characters,
// with letters and digits. Existing passwords still work at login.
export const PASSWORD_HINT = 'At least 8 characters, with letters and numbers.';

export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'Password must include both letters and numbers.';
  return null;
}
