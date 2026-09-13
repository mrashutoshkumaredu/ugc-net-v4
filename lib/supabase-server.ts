import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side Supabase client for use inside Route Handlers (app/api/*).
// Reads the session from the request's cookies (set by lib/supabase.ts's
// createBrowserClient) so RLS policies keyed on auth.uid() work the same
// way they do for direct client-side Supabase calls.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render, not a Route Handler —
            // safe to ignore since middleware (if any) would refresh instead.
          }
        },
      },
    }
  );
}
