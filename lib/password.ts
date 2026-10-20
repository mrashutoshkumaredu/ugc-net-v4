// The password rule for new and changed passwords. Keep it the same as the
// Supabase dashboard setting (Authentication > Email): at least 8 characters,
// with lowercase and uppercase letters, digits and symbols.
// Existing passwords still work at login.
export const PASSWORD_HINT = 'At least 8 characters, with a capital letter, a small letter, a number and a symbol (for example Net@paper1).';

// The symbols Supabase accepts: !@#$%^&*()_+-=[]{};'\:"|<>?,./`~
const SYMBOL = /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/;

export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  const missing: string[] = [];
  if (!/[A-Z]/.test(password)) missing.push('a capital letter');
  if (!/[a-z]/.test(password)) missing.push('a small letter');
  if (!/[0-9]/.test(password)) missing.push('a number');
  if (!SYMBOL.test(password)) missing.push('a symbol such as @ or #');
  if (missing.length === 0) return null;
  const list = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}`;
  return `Password must also include ${list}.`;
}
