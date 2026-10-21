import { getAdmin } from '../../../../lib/supabaseAdmin';
import { ok, fail } from '../../../../lib/http';
import { requireUser, httpError } from '../../../../lib/serverAuth';
import { ensureCurrentRound, phaseOf, MIN_STAKE, MAX_STAKE } from '../../../../lib/game';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await requireUser(request);
    const { deck, stake, autoCashout } = await request.json();

    if (deck !== 'A' && deck !== 'B') throw httpError(400, 'Invalid deck.');
    const amount = Math.floor(Number(stake) * 100) / 100;
    if (!(amount >= MIN_STAKE)) throw httpError(400, `Minimum wager is KES ${MIN_STAKE}.`);
    if (amount > MAX_STAKE) throw httpError(400, `Maximum wager is KES ${MAX_STAKE.toLocaleString()}.`);

    let auto = null;
    if (autoCashout !== null && autoCashout !== undefined && autoCashout !== '') {
      auto = Math.floor(Number(autoCashout) * 100) / 100;
      if (!(auto >= 1.01) || auto > 1000) throw httpError(400, 'Auto cash-out must be between 1.01x and 1000x.');
    }

    const round = await ensureCurrentRound();
    if (phaseOf(round) !== 'betting') throw httpError(409, 'Betting is closed for this round.');

    const { data: balance, error } = await getAdmin().rpc('place_bet', {
      p_user: user.id, p_round: round.nonce, p_deck: deck, p_stake: amount, p_auto: auto,
    });
    if (error) {
      const m = error.message || '';
      if (/Insufficient/.test(m)) throw httpError(400, 'Selected stake exceeds your available balance.');
      if (/closed/.test(m)) throw httpError(409, 'Betting is closed for this round.');
      if (/already/.test(m)) throw httpError(409, 'You already have a bet on this deck for this round.');
      throw httpError(400, 'Could not place bet.');
    }
    return ok({ balance: Number(balance), round: round.nonce });
  } catch (e) {
    return fail(e);
  }
}
