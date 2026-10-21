import { createClient } from '@supabase/supabase-js';

// Browser client (anon key). Row Level Security restricts it to reading the user's own rows.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing-anon-key'
);
