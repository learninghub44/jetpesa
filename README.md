# JetPesa

Aviator-style crash game built with Next.js, **Supabase** (auth + database) and **Paystack** (M-Pesa deposits and withdrawals).

## How it works

- **Auth:** Supabase Auth. Sign in with email or phone number (phone is resolved server-side). Signup requires an 18+ confirmation and, by default, email verification (needs "Confirm email" on and working SMTP in Supabase; set `REQUIRE_EMAIL_VERIFICATION=false` to disable).
- **Wallet:** balances live in `profiles.wallet_balance`. Browsers can only *read* their own row. Every balance change goes through SQL functions that only the server (service role) can call, and each one writes to `wallet_ledger`.
- **Game:** rounds are created and settled on the server. The crash point stays in the database until the round has crashed; bets and cash-outs are validated against the server clock and paid by the server.
- **Provably fair:** each round publishes `sha256(roundSeed)` up front and reveals the seed after the crash (`/api/game/provably?nonce=N`). Crash point = f(HMAC_SHA256(roundSeed, `clientSeed:nonce`)).
- **Deposits:** M-Pesa STK push via Paystack or PayHero (player can choose; Automatic tries Paystack, then PayHero). Paystack is confirmed by its signed webhook; PayHero callbacks are unsigned, so they only trigger a server-side status check with PayHero before crediting. A polling fallback covers late callbacks. Credited exactly once.
- **Withdrawals (Paystack only):** wallet is debited first, then a Paystack Transfer to the account's M-Pesa number. Failed or reversed transfers are refunded automatically via webhook.

## Setup

1. `npm install`
2. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local` and fill it in.
4. In Paystack, register `https://<your-domain>/api/paystack-webhook`, enable M-Pesa, and for withdrawals fund your Paystack balance and turn off transfer OTP.
5. `npm run dev`

## Before going live

Deposits, bets and withdrawals are disabled until `NEXT_PUBLIC_BCLB_LICENCE_NO` is set. Only set it if you actually hold the licence.

Run `PAYSTACK_SECRET_KEY=sk_... node scripts/paystack-check.mjs 07XXXXXXXX` to verify M-Pesa payout setup before launch (add `--transfer` to send a real KES 50 test payout).

- Real-money gaming in Kenya requires a licence from the Betting Control and Licensing Board (BCLB). Paystack also restricts gambling merchants. Confirm both before taking deposits.
- Never commit `.env.local` or keys.
- Add 18+ and responsible-gambling messaging appropriate to your licence.

## License

See `LICENSE`.
