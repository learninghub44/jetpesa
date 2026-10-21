import { NextResponse } from 'next/server';
import { getAdmin } from '../../../lib/supabaseAdmin';
import { verifyWebhookSignature, toSubunit } from '../../../lib/paystack';

export const dynamic = 'force-dynamic';

// Set this URL in Paystack Dashboard → Settings → API Keys & Webhooks.
export async function POST(request) {
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ received: false }, { status: 401 });
  }

  const admin = getAdmin();
  let event;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ received: true }); }
  const data = event.data || {};
  const reference = data.reference;

  try {
    switch (event.event) {
      case 'charge.success': {
        const { data: dep } = await admin.from('deposits').select('*').eq('reference', reference).maybeSingle();
        if (!dep) break;
        // Never trust the event blindly: amount and currency must match what we asked for.
        if (data.amount !== toSubunit(dep.amount) || data.currency !== 'KES') {
          await admin.from('deposits').update({ status: 'failed', failure_reason: 'Amount mismatch.', provider_response: data, updated_at: new Date().toISOString() }).eq('reference', reference).eq('credited', false);
          break;
        }
        await admin.rpc('credit_deposit', { p_reference: reference, p_response: data });
        break;
      }
      case 'charge.failed': {
        await admin.from('deposits').update({ status: 'failed', failure_reason: data.gateway_response || data.message || 'Payment failed.', provider_response: data, updated_at: new Date().toISOString() }).eq('reference', reference).eq('status', 'pending');
        break;
      }
      case 'transfer.success': {
        await admin.from('withdrawals').update({ status: 'paid', transfer_code: data.transfer_code || null, updated_at: new Date().toISOString() }).eq('reference', reference).eq('status', 'processing');
        break;
      }
      case 'transfer.failed':
      case 'transfer.reversed': {
        await admin.rpc('fail_withdrawal', { p_reference: reference, p_reason: data.reason || event.event });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error('paystack webhook error', e);
    return NextResponse.json({ received: false }, { status: 500 }); // Paystack will retry
  }
  return NextResponse.json({ received: true });
}
