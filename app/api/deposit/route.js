import { getAdmin } from '../../../lib/supabaseAdmin';
import { ok, fail } from '../../../lib/http';
import { requireUser, httpError, normalizePhone } from '../../../lib/serverAuth';
import { paystack, toSubunit } from '../../../lib/paystack';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await requireUser(request);
    const { amount, phone } = await request.json();

    const amt = Math.floor(Number(amount));
    if (!amt || amt < 49) throw httpError(400, 'Minimum deposit is KES 49.');
    if (amt > 150000) throw httpError(400, 'Maximum deposit is KES 150,000.');
    const cleanPhone = normalizePhone(phone);

    const admin = getAdmin();
    const reference = `JP-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    const { error: insErr } = await admin.from('deposits').insert({
      reference, user_id: user.id, amount: amt, phone: cleanPhone, status: 'pending', provider: 'paystack',
    });
    if (insErr) throw httpError(500, 'Could not start deposit.');

    const res = await paystack('/charge', {
      method: 'POST',
      body: {
        email: user.email,
        amount: toSubunit(amt),
        currency: 'KES',
        reference,
        mobile_money: { phone: `+${cleanPhone}`, provider: 'mpesa' },
      },
    });

    if (!res.ok) {
      const reason = res.json?.message || 'M-Pesa request failed.';
      await admin.from('deposits').update({ status: 'failed', failure_reason: reason, provider_response: res.json, updated_at: new Date().toISOString() }).eq('reference', reference);
      throw httpError(400, reason);
    }

    await admin.from('deposits').update({ provider_response: res.json, updated_at: new Date().toISOString() }).eq('reference', reference);
    return ok({ status: 'pending', provider: 'paystack', reference, message: 'STK push sent. Complete payment on your phone.' });
  } catch (e) {
    return fail(e);
  }
}
