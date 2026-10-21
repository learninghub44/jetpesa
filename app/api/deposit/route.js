import { getAdmin } from '../../../lib/supabaseAdmin';
import { ok, fail } from '../../../lib/http';
import { requireUser, httpError, normalizePhone } from '../../../lib/serverAuth';
import { paystack, toSubunit } from '../../../lib/paystack';
import { payheroStkPush, payheroConfigured } from '../../../lib/payhero';

export const dynamic = 'force-dynamic';

function baseUrl(request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const host = request.headers.get('host');
  return `${host?.includes('localhost') ? 'http' : 'https'}://${host}`;
}

export async function POST(request) {
  try {
    const user = await requireUser(request);
    const { amount, phone, provider } = await request.json();

    const amt = Math.floor(Number(amount));
    if (!amt || amt < 49) throw httpError(400, 'Minimum deposit is KES 49.');
    if (amt > 150000) throw httpError(400, 'Maximum deposit is KES 150,000.');
    const cleanPhone = normalizePhone(phone);

    // 'paystack' | 'payhero' | anything else = automatic (Paystack first, PayHero as fallback)
    const order =
      provider === 'payhero' ? ['payhero'] :
      provider === 'paystack' ? ['paystack'] :
      ['paystack', ...(payheroConfigured() ? ['payhero'] : [])];

    const admin = getAdmin();
    let lastError = 'M-Pesa request failed.';

    for (const name of order) {
      const reference = `JP-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
      const { error: insErr } = await admin.from('deposits').insert({
        reference, user_id: user.id, amount: amt, phone: cleanPhone, status: 'pending', provider: name,
      });
      if (insErr) throw httpError(500, 'Could not start deposit.');

      const markFailed = (reason, resp) =>
        admin.from('deposits').update({ status: 'failed', failure_reason: reason, provider_response: resp ?? null, updated_at: new Date().toISOString() }).eq('reference', reference);

      if (name === 'payhero') {
        if (!payheroConfigured()) { lastError = 'PayHero is not configured.'; await markFailed(lastError); continue; }
        const r = await payheroStkPush({ amount: amt, phone: cleanPhone, reference, callbackUrl: `${baseUrl(request)}/api/payhero-callback` });
        if (!r.ok) { lastError = r.json?.error_message || r.json?.message || 'PayHero request failed.'; await markFailed(lastError, r.json); continue; }
        await admin.from('deposits').update({ provider_reference: r.json.reference || null, provider_response: r.json, updated_at: new Date().toISOString() }).eq('reference', reference);
        return ok({ status: 'pending', provider: 'payhero', reference, message: 'STK push sent. Complete payment on your phone.' });
      }

      const res = await paystack('/charge', {
        method: 'POST',
        body: { email: user.email, amount: toSubunit(amt), currency: 'KES', reference, mobile_money: { phone: `+${cleanPhone}`, provider: 'mpesa' } },
      });
      if (!res.ok) { lastError = res.json?.message || 'Paystack request failed.'; await markFailed(lastError, res.json); continue; }
      await admin.from('deposits').update({ provider_response: res.json, updated_at: new Date().toISOString() }).eq('reference', reference);
      return ok({ status: 'pending', provider: 'paystack', reference, message: 'STK push sent. Complete payment on your phone.' });
    }

    throw httpError(400, lastError);
  } catch (e) {
    return fail(e);
  }
}
