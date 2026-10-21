import crypto from 'crypto';

const BASE = 'https://api.paystack.co';

function secret() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('Missing PAYSTACK_SECRET_KEY.');
  return key;
}

export async function paystack(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${secret()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok && json.status !== false, status: res.status, json };
}

// Paystack signs webhooks with HMAC-SHA512 of the raw body using your secret key.
export function verifyWebhookSignature(rawBody, signature) {
  if (!signature) return false;
  const expected = crypto.createHmac('sha512', secret()).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// KES amounts are sent in the lowest denomination (x100).
export const toSubunit = (kes) => Math.round(Number(kes) * 100);
