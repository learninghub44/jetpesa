import { getAdmin } from '../../../lib/supabaseAdmin';
import { ok, fail } from '../../../lib/http';
import { requireUser, httpError } from '../../../lib/serverAuth';
import { verifyPendingDeposit } from '../../../lib/deposits';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await requireUser(request);
    const reference = new URL(request.url).searchParams.get('reference');
    if (!reference) throw httpError(400, 'Missing reference.');

    const admin = getAdmin();
    let { data: dep } = await admin.from('deposits').select('*').eq('reference', reference).eq('user_id', user.id).maybeSingle();
    if (!dep) throw httpError(404, 'Transaction not found.');

    // Webhooks/callbacks are the primary path; this provider lookup is the fallback.
    if (dep.status === 'pending') {
      await verifyPendingDeposit(admin, dep);
      ({ data: dep } = await admin.from('deposits').select('*').eq('reference', reference).single());
    }

    const { data: prof } = await admin.from('profiles').select('wallet_balance').eq('id', user.id).single();
    return ok({ status: dep.status, failureReason: dep.failure_reason, balance: Number(prof?.wallet_balance || 0) });
  } catch (e) {
    return fail(e);
  }
}
