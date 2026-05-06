import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | undefined;

function client(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Prefer service role key (bypasses RLS). Fall back to publishable key
    // if only the new-format anon key is available.
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    _client = createClient(url, key, { auth: { persistSession: false } });
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(_target, prop) { return (client() as any)[prop]; },
});
