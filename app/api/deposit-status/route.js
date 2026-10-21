import { getAdmin } from '../../../lib/supabaseAdmin';
import { ok, fail } from '../../../lib/http';
import { requireUser, httpError } from '../../../lib/serverAuth';
import { paystack, toSubunit } from '../../../lib/paystack';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await requireUser(request);
    const reference = new URL(request.url).searchParams.get('reference');
    if (!reference) throw httpError(400, 'Missing reference.');

    const admin = getAdmin();
    let { data: dep } = await admin.from('deposits').select('*').eq('reference', reference).eq('user_id', user.id).maybeSingle();
    if (!dep) throw httpError(404, 'Transaction not found.');

    // Webhook is the primary path; this verify call is a fallback if it is delayed.
    if (dep.status === 'pending') {
      const v = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
      const d = v.json?.data;
      if (v.ok && d?.status === 'success' && d.amount === toSubunit(dep.amount) && d.currency === 'KES') {
        await admin.rpc('credit_deposit', { p_reference: reference, p_response: d });
      } else if (v.ok && ['failed', 'abandoned', 'reversed'].includes(d?.status)) {
        await admin.from('deposits').update({ status: 'failed', failure_reason: d.gateway_response || 'Payment failed or was cancelled.', updated_at: new Date().toISOString() }).eq('reference', reference).eq('status', 'pending');
      }
      ({ data: dep } = await admin.from('deposits').select('*').eq('reference', reference).single());
    }

    const { data: prof } = await admin.from('profiles').select('wallet_balance').eq('id', user.id).single();
    return ok({ status: dep.status, failureReason: dep.failure_reason, balance: Number(prof?.wallet_balance || 0) });
  } catch (e) {
    return fail(e);
  }
}
