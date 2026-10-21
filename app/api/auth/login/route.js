import { createClient } from '@supabase/supabase-js';
import { getAdmin } from '../../../../lib/supabaseAdmin';
import { ok, fail } from '../../../../lib/http';
import { httpError, localPhone } from '../../../../lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();
    let email = String(identifier || '').trim().toLowerCase();
    if (!email || !password) throw httpError(400, 'Enter your email or phone and password.');

    // Phone login is resolved server-side so emails are never exposed to the browser.
    if (!email.includes('@')) {
      let phone;
      try { phone = localPhone(email); } catch { throw httpError(401, 'Invalid credentials.'); }
      const { data } = await getAdmin().from('profiles').select('email').eq('mpesa_phone', phone).maybeSingle();
      if (!data) throw httpError(401, 'Invalid credentials.');
      email = data.email;
    }

    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data, error } = await anon.auth.signInWithPassword({ email, password });
    if (error || !data?.session) throw httpError(401, 'Invalid credentials.');
    return ok({ session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token } });
  } catch (e) {
    return fail(e);
  }
}
