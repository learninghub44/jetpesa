// Usage: PAYSTACK_SECRET_KEY=sk_... node scripts/paystack-check.mjs 0712345678 [--transfer]
const key = process.env.PAYSTACK_SECRET_KEY;
const phoneArg = process.argv[2];
if (!key || !phoneArg) { console.error('Set PAYSTACK_SECRET_KEY and pass an M-Pesa number.'); process.exit(1); }

let phone = phoneArg.replace(/\s+/g, '').replace(/^\+/, '');
if (phone.startsWith('0')) phone = `254${phone.slice(1)}`;
const call = async (path, body) => {
  const res = await fetch(`https://api.paystack.co${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json() };
};

const bal = await call('/balance');
console.log('Balance:', JSON.stringify(bal.json.data ?? bal.json));

const rec = await call('/transferrecipient', {
  type: 'mobile_money', name: 'JetPesa payout check', account_number: phone, bank_code: 'MPESA', currency: 'KES',
});
console.log('Recipient:', rec.status, rec.json.message, rec.json.data?.recipient_code ?? '');

if (process.argv.includes('--transfer') && rec.json.data?.recipient_code) {
  const tr = await call('/transfer', {
    source: 'balance', amount: 5000, currency: 'KES', recipient: rec.json.data.recipient_code,
    reference: `check-${Date.now()}`, reason: 'JetPesa payout check',
  });
  console.log('Transfer:', tr.status, tr.json.message, 'status =', tr.json.data?.status);
  if (tr.json.data?.status === 'otp') console.log('Transfer OTP is ON: disable it in Paystack settings or withdrawals will be refunded.');
}
