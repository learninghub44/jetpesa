# JetPesa

Aviator-style crash game built with Next.js, **Supabase** (auth + database) and **Paystack** (M-Pesa deposits and withdrawals).

## How it works

- **Auth:** Supabase Auth. Sign in with email or phone number (phone is resolved server-side).
- **Wallet:** balances live in `profiles.wallet_balance`. Browsers can only *read* their own row. Every balance change goes through SQL functions that only the server (service role) can call, and each one writes to `wallet_ledger`.
- **Game:** rounds are created and settled on the server. The crash point stays in the database until the round has crashed; bets and cash-outs are validated against the server clock and paid by the server.
- **Provably fair:** each round publishes `sha256(roundSeed)` up front and reveals the seed after the crash (`/api/game/provably?nonce=N`). Crash point = f(HMAC_SHA256(roundSeed, `clientSeed:nonce`)).
- **Deposits:** Paystack Charge API (M-Pesa STK push), confirmed by the signed `charge.success` webhook, with a verify fallback. Credited exactly once.
- **Withdrawals:** wallet is debited first, then a Paystack Transfer to the account's M-Pesa number. Failed or reversed transfers are refunded automatically via webhook.

## Setup

1. `npm install`
2. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local` and fill it in.
4. In Paystack, register `https://<your-domain>/api/paystack-webhook`, enable M-Pesa, and for withdrawals fund your Paystack balance and turn off transfer OTP.
5. `npm run dev`

## Before going live

- Real-money gaming in Kenya requires a licence from the Betting Control and Licensing Board (BCLB). Paystack also restricts gambling merchants. Confirm both before taking deposits.
- Never commit `.env.local` or keys.
- Add 18+ and responsible-gambling messaging appropriate to your licence.

## License

See `LICENSE`.
