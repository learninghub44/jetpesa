const BASE = 'https://backend.payhero.co.ke/api/v2';

export function payheroConfigured() {
  return !!(process.env.PAYHERO_API_USERNAME && process.env.PAYHERO_API_PASSWORD && process.env.PAYHERO_CHANNEL_ID);
}

function authHeader() {
  const token = Buffer.from(`${process.env.PAYHERO_API_USERNAME}:${process.env.PAYHERO_API_PASSWORD}`).toString('base64');
  return `Basic ${token}`;
}

export async function payheroStkPush({ amount, phone, reference, callbackUrl }) {
  const res = await fetch(`${BASE}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
    body: JSON.stringify({
      amount,
      phone_number: phone,
      channel_id: Number(process.env.PAYHERO_CHANNEL_ID),
      provider: 'm-pesa',
      external_reference: reference,
      callback_url: callbackUrl,
    }),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok && (res.status === 201 || json.success === true), json };
}

// Returns 'SUCCESS' | 'FAILED' | 'QUEUED' | null. Callbacks are not signed, so this
// server-to-server lookup is what we trust before crediting a wallet.
export async function payheroStatus(providerReference) {
  if (!providerReference) return null;
  const res = await fetch(`${BASE}/transaction-status?reference=${encodeURIComponent(providerReference)}`, {
    headers: { Authorization: authHeader() },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  return String(json.status || '').toUpperCase() || null;
}
