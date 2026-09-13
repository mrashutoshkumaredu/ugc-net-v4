import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local.'
  );
}

// createBrowserClient (from @supabase/ssr) stores the session in cookies as
// well as localStorage, so the API routes under app/api/* can read the same
// session server-side via lib/supabase-server.ts.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
