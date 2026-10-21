import { getAdmin } from '../../../lib/supabaseAdmin';
import { ok, fail } from '../../../lib/http';
import { requireUser, httpError, normalizePhone } from '../../../lib/serverAuth';
import { paystack, toSubunit } from '../../../lib/paystack';

export const dynamic = 'force-dynamic';

const MIN = 50;
const MAX = Number(process.env.MAX_WITHDRAWAL || 20000);

export async function POST(request) {
  let reference;
  const admin = getAdmin();
  try {
    const user = await requireUser(request);
    const amt = Math.floor(Number((await request.json()).amount));
    if (!amt || amt < MIN) throw httpError(400, `Minimum withdrawal is KES ${MIN}.`);
    if (amt > MAX) throw httpError(400, `Maximum withdrawal is KES ${MAX.toLocaleString()}.`);

    // Payouts only go to the M-Pesa number on the account.
    const { data: prof } = await admin.from('profiles').select('mpesa_phone, display_name').eq('id', user.id).single();
    const phone = normalizePhone(prof?.mpesa_phone);

    reference = `wd-${Date.now()}-${Math.floor(Math.random() * 99999)}`;
    const { data: newBal, error: debitErr } = await admin.rpc('start_withdrawal', {
      p_user: user.id, p_amount: amt, p_phone: phone, p_reference: reference,
    });
    if (debitErr) throw httpError(400, /Insufficient/.test(debitErr.message) ? 'Withdrawal exceeds wallet balance.' : 'Could not start withdrawal.');

    const refund = async (msg) => { await admin.rpc('fail_withdrawal', { p_reference: reference, p_reason: msg }); throw httpError(502, msg); };

    const rec = await paystack('/transferrecipient', {
      method: 'POST',
      body: { type: 'mobile_money', name: prof.display_name || user.email, account_number: phone, bank_code: 'MPESA', currency: 'KES' },
    });
    if (!rec.ok) await refund(rec.json?.message || 'Could not set up payout.');

    const tr = await paystack('/transfer', {
      method: 'POST',
      body: { source: 'balance', amount: toSubunit(amt), recipient: rec.json.data.recipient_code, reference, reason: 'JetPesa withdrawal', currency: 'KES' },
    });
    if (!tr.ok) await refund(tr.json?.message || 'Payout failed.');
    if (tr.json?.data?.status === 'otp') await refund('Payout needs manual approval. Contact support.');

    await admin.from('withdrawals').update({ transfer_code: tr.json.data.transfer_code || null, updated_at: new Date().toISOString() }).eq('reference', reference);
    return ok({ balance: Number(newBal), message: `Withdrawal of KES ${amt} is on its way to your M-Pesa.` });
  } catch (e) {
    return fail(e);
  }
}
