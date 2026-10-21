import { createClient } from '@supabase/supabase-js';
import { getAdmin } from '../../../../lib/supabaseAdmin';
import { ok, fail } from '../../../../lib/http';
import { httpError, localPhone } from '../../../../lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email, password, phone, over18 } = await request.json();
    if (over18 !== true) throw httpError(400, 'You must confirm you are 18 or older.');
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) throw httpError(400, 'Enter a valid email address.');
    if (String(password || '').length < 8) throw httpError(400, 'Password must be at least 8 characters.');
    let mpesaPhone;
    try { mpesaPhone = localPhone(phone); } catch { throw httpError(400, 'Enter a valid phone number, e.g. 0712345678 or 0112345678.'); }

    const admin = getAdmin();
    const { data: existing } = await admin.from('profiles').select('id').eq('mpesa_phone', mpesaPhone).maybeSingle();
    if (existing) throw httpError(409, 'That phone number is already registered.');

    const anonClient = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    // Email verification is ON by default. Set REQUIRE_EMAIL_VERIFICATION=false to skip it.
    // (Needs "Confirm email" enabled in Supabase Auth settings and working SMTP.)
    if (process.env.REQUIRE_EMAIL_VERIFICATION !== 'false') {
      const site = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
      const { data, error } = await anonClient().auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { mpesa_phone: mpesaPhone, over_18: true },
          ...(site ? { emailRedirectTo: `${site}/auth?tab=login` } : {}),
        },
      });
      if (error) {
        if (/already|registered|exists/i.test(error.message)) throw httpError(409, 'That email is already registered.');
        throw httpError(400, 'Could not create account. Check your details and try again.');
      }
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw httpError(409, 'That email is already registered.');
      }
      return ok({ verifyEmail: true });
    }

    const { error } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { mpesa_phone: mpesaPhone, over_18: true },
    });
    if (error) {
      if (/already|registered|exists/i.test(error.message)) throw httpError(409, 'That email is already registered.');
      throw httpError(400, 'Could not create account. Check your details and try again.');
    }

    // Sign in immediately so the client gets a session.
    const { data, error: signInErr } = await anonClient().auth.signInWithPassword({ email: cleanEmail, password });
    if (signInErr) throw httpError(400, 'Account created. Please sign in.');
    return ok({ session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token } });
  } catch (e) {
    return fail(e);
  }
}
