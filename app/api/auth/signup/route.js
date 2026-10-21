import { createClient } from '@supabase/supabase-js';
import { getAdmin } from '../../../../lib/supabaseAdmin';
import { ok, fail } from '../../../../lib/http';
import { httpError, localPhone } from '../../../../lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email, password, phone } = await request.json();
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) throw httpError(400, 'Enter a valid email address.');
    if (String(password || '').length < 8) throw httpError(400, 'Password must be at least 8 characters.');
    let mpesaPhone;
    try { mpesaPhone = localPhone(phone); } catch { throw httpError(400, 'Enter a valid phone number, e.g. 0712345678 or 0112345678.'); }

    const admin = getAdmin();
    const { data: existing } = await admin.from('profiles').select('id').eq('mpesa_phone', mpesaPhone).maybeSingle();
    if (existing) throw httpError(409, 'That phone number is already registered.');

    const { error } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { mpesa_phone: mpesaPhone },
    });
    if (error) {
      if (/already|registered|exists/i.test(error.message)) throw httpError(409, 'That email is already registered.');
      throw httpError(400, 'Could not create account. Check your details and try again.');
    }

    // Sign in immediately so the client gets a session.
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data, error: signInErr } = await anon.auth.signInWithPassword({ email: cleanEmail, password });
    if (signInErr) throw httpError(400, 'Account created. Please sign in.');
    return ok({ session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token } });
  } catch (e) {
    return fail(e);
  }
}
