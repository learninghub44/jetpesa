import crypto from 'crypto';
import { getAdmin } from './supabaseAdmin';

export const GROWTH = 0.078;          // multiplier = e^(GROWTH * seconds)  (matches SQL round_multiplier)
export const COUNTDOWN_MS = 5000;     // betting window
export const GAP_MS = 3500;           // pause after a crash before the next round opens
export const MAX_CRASH = 1000;
export const MIN_STAKE = 10;
export const MAX_STAKE = Number(process.env.MAX_STAKE || 10000);
export const HOUSE_EDGE = 0.03;

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
const hmac = (key, msg) => crypto.createHmac('sha256', key).update(msg).digest('hex');

export function clientSeed() {
  return process.env.GAME_CLIENT_SEED || 'jetpesa_public_client_seed';
}

function masterSecret() {
  const s = process.env.GAME_SERVER_SEED;
  if (!s) throw new Error('Missing GAME_SERVER_SEED.');
  return s;
}

// Each round has its own seed. Only sha256(seed) is public until the round crashes.
export function roundSeed(nonce) {
  return hmac(masterSecret(), `round:${nonce}`);
}

export function crashFromHash(hash) {
  const h = BigInt(`0x${hash.slice(0, 13)}`);
  const e = 2n ** 52n;
  if (h % 33n === 0n) return 1.0; // ~3% instant crash = house edge
  const result = Number((100n * e - h) / (e - h)) / 100;
  return Math.min(MAX_CRASH, Math.max(1.0, Math.floor(result * 100) / 100));
}

export function roundProof(nonce) {
  const seed = roundSeed(nonce);
  const verifyInput = `${clientSeed()}:${nonce}`;
  const roundHash = hmac(seed, verifyInput);
  return { seed, commitment: sha256(seed), verifyInput, roundHash, crashPoint: crashFromHash(roundHash) };
}

export function multiplierAt(takeoffMs, atMs) {
  const sec = Math.max(0, (atMs - takeoffMs) / 1000);
  return Math.max(1, Math.floor(Math.exp(GROWTH * sec) * 100) / 100);
}

const ts = (v) => new Date(v).getTime();

// Creates the next round lazily when the current one has finished (no cron needed).
export async function ensureCurrentRound() {
  const admin = getAdmin();
  for (let i = 0; i < 12; i++) {
    const { data: latest } = await admin.from('rounds').select('*').order('nonce', { ascending: false }).limit(1).maybeSingle();
    const now = Date.now();
    if (latest && now < ts(latest.crash_at) + GAP_MS) return latest;

    const nonce = latest ? latest.nonce + 1 : 1;
    const proof = roundProof(nonce);
    const nextSlot = latest ? ts(latest.crash_at) + GAP_MS : now;
    const start = now - nextSlot > 30000 ? now : nextSlot;
    const takeoff = start + COUNTDOWN_MS;
    const flightMs = Math.ceil((Math.log(proof.crashPoint) / GROWTH) * 1000);

    const { error } = await admin.from('rounds').insert({
      nonce,
      crash_point: proof.crashPoint,
      commitment: proof.commitment,
      start_at: new Date(start).toISOString(),
      takeoff_at: new Date(takeoff).toISOString(),
      crash_at: new Date(takeoff + flightMs).toISOString(),
    });
    // unique violation => another request created it first; loop and re-read.
    if (error && error.code !== '23505') throw error;
    await admin.rpc('settle_crashed_rounds');
  }
  throw new Error('Could not establish current round.');
}

export function phaseOf(round, now = Date.now()) {
  if (now < ts(round.takeoff_at)) return 'betting';
  if (now < ts(round.crash_at)) return 'flying';
  return 'crashed';
}

const mask = (p) => (p && p.length >= 7 ? `${p.slice(0, 3)}***${p.slice(-2)}` : 'Player***');

export async function buildState(userId) {
  const admin = getAdmin();
  const round = await ensureCurrentRound();
  const now = Date.now();
  const phase = phaseOf(round, now);
  if (phase === 'crashed') await admin.rpc('settle_crashed_rounds');

  const takeoff = ts(round.takeoff_at);
  const [profile, hist, bets, mine, myHistory] = await Promise.all([
    admin.from('profiles').select('wallet_balance, display_name, mpesa_phone').eq('id', userId).single(),
    admin.from('rounds').select('nonce, crash_point').lte('crash_at', new Date(now).toISOString()).order('nonce', { ascending: false }).limit(14),
    admin.from('bets').select('user_id, deck, stake, status, cashout_multiplier, payout').eq('round_nonce', round.nonce).order('id', { ascending: false }).limit(40),
    admin.from('bets').select('deck, stake, auto_cashout, status, cashout_multiplier, payout').eq('round_nonce', round.nonce).eq('user_id', userId),
    admin.from('bets').select('round_nonce, stake, status, cashout_multiplier, payout').eq('user_id', userId).neq('status', 'open').order('id', { ascending: false }).limit(20),
  ]);

  const ids = [...new Set((bets.data || []).map((b) => b.user_id))];
  const profs = ids.length ? await admin.from('profiles').select('id, mpesa_phone').in('id', ids) : { data: [] };
  const phoneById = Object.fromEntries((profs.data || []).map((p) => [p.id, p.mpesa_phone]));

  const crashed = phase === 'crashed';
  return {
    success: true,
    serverTime: now,
    balance: Number(profile.data?.wallet_balance || 0),
    round: {
      nonce: round.nonce,
      phase,
      commitment: round.commitment,
      takeoffAt: takeoff,
      msUntilTakeoff: Math.max(0, takeoff - now),
      multiplier: phase === 'flying' ? multiplierAt(takeoff, now) : phase === 'betting' ? 1 : Number(round.crash_point),
      crashPoint: crashed ? Number(round.crash_point) : null, // never revealed before the crash
    },
    history: (hist.data || []).map((r) => Number(r.crash_point)),
    liveBets: (bets.data || []).map((b) => ({
      id: `${b.user_id}-${b.deck}`,
      username: mask(phoneById[b.user_id]),
      bet: Number(b.stake),
      status: b.status === 'open' ? (phase === 'flying' ? 'flying' : 'queued') : b.status === 'won' ? 'cashed' : 'lost',
      mult: b.cashout_multiplier ? Number(b.cashout_multiplier) : null,
      payout: Number(b.payout || 0),
    })),
    playerCount: ids.length,
    myBets: (mine.data || []).map((b) => ({
      deck: b.deck, stake: Number(b.stake), autoCashout: b.auto_cashout ? Number(b.auto_cashout) : null,
      status: b.status, multiplier: b.cashout_multiplier ? Number(b.cashout_multiplier) : null, payout: Number(b.payout || 0),
    })),
    myHistory: (myHistory.data || []).map((b) => ({
      roundId: String(b.round_nonce), stake: Number(b.stake), multiplier: Number(b.cashout_multiplier || 0),
      yieldAmount: Number(b.payout || 0), status: b.status === 'won' ? 'WON' : 'LOST',
    })),
  };
}
