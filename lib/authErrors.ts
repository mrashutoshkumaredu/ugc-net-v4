// Supabase Auth returns technical messages ("Invalid login credentials",
// raw network errors). Map the common ones to one plain sentence each.
// Ported from the SSC Steno portal.
export function mapAuthError(error: unknown): string {
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const msg = raw.toLowerCase();

  if (!raw) return 'Something went wrong. Please try again.';
  if (msg.includes('invalid login credentials')) {
    return "That email and password combination doesn't match our records.";
  }
  if (msg.includes('email not confirmed')) {
    return 'Please confirm your email address first. Check your inbox for the confirmation link.';
  }
  if (msg.includes('already registered')) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (msg.includes('password') && (msg.includes('short') || msg.includes('at least') || msg.includes('6 characters'))) {
    return 'Password is too short. Please use at least 6 characters.';
  }
  if (msg.includes('pwned') || msg.includes('leaked') || msg.includes('weak password')) {
    return 'This password has appeared in a data leak. Please choose a different one.';
  }
  if (msg.includes('failed to fetch') || msg.includes('network')) {
    return "Couldn't reach the server. Check your internet connection and try again.";
  }
  if (msg.includes('user not found')) {
    return 'No account found for that email address.';
  }
  return 'Something went wrong. Please try again.';
}
