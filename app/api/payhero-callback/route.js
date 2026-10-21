import { NextResponse } from 'next/server';
import { getAdmin } from '../../../lib/supabaseAdmin';
import { verifyPendingDeposit } from '../../../lib/deposits';

export const dynamic = 'force-dynamic';

// PayHero callbacks are unsigned, so the body is only used to find the deposit.
// Crediting happens only after PayHero's transaction-status API confirms SUCCESS.
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ received: true }); }

  const r = body?.response || body || {};
  const reference = r.ExternalReference || r.external_reference || body?.external_reference;
  if (!reference) return NextResponse.json({ received: true });

  try {
    const admin = getAdmin();
    const { data: dep } = await admin.from('deposits').select('*').eq('reference', reference).eq('provider', 'payhero').maybeSingle();
    if (!dep || dep.status !== 'pending') return NextResponse.json({ received: true });

    if (!dep.provider_reference && r.CheckoutRequestID) {
      // status lookups need PayHero's own reference; fall back to what the callback carries
      dep.provider_reference = body?.reference || r.reference || null;
    }
    await verifyPendingDeposit(admin, dep);
  } catch (e) {
    console.error('payhero callback error', e);
    return NextResponse.json({ received: false }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
