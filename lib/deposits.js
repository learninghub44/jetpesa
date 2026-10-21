import { paystack, toSubunit } from './paystack';
import { payheroStatus } from './payhero';

// Re-checks a pending deposit with its provider and credits/fails it. Safe to call repeatedly.
export async function verifyPendingDeposit(admin, dep) {
  const now = new Date().toISOString();

  if (dep.provider === 'payhero') {
    const status = await payheroStatus(dep.provider_reference);
    if (status === 'SUCCESS') {
      await admin.rpc('credit_deposit', { p_reference: dep.reference, p_response: { provider: 'payhero', status } });
    } else if (status === 'FAILED') {
      await admin.from('deposits').update({ status: 'failed', failure_reason: 'Payment failed or was cancelled.', updated_at: now }).eq('reference', dep.reference).eq('status', 'pending');
    }
    return;
  }

  const v = await paystack(`/transaction/verify/${encodeURIComponent(dep.reference)}`);
  const d = v.json?.data;
  if (v.ok && d?.status === 'success' && d.amount === toSubunit(dep.amount) && d.currency === 'KES') {
    await admin.rpc('credit_deposit', { p_reference: dep.reference, p_response: d });
  } else if (v.ok && ['failed', 'abandoned', 'reversed'].includes(d?.status)) {
    await admin.from('deposits').update({ status: 'failed', failure_reason: d.gateway_response || 'Payment failed or was cancelled.', updated_at: now }).eq('reference', dep.reference).eq('status', 'pending');
  }
}
