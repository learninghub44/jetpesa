import { getAdmin } from '../../../../lib/supabaseAdmin';
import { ok, fail } from '../../../../lib/http';
import { requireUser, httpError } from '../../../../lib/serverAuth';
import { ensureCurrentRound } from '../../../../lib/game';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await requireUser(request);
    const { deck, auto } = await request.json();
    if (deck !== 'A' && deck !== 'B') throw httpError(400, 'Invalid deck.');

    const round = await ensureCurrentRound();
    const { data, error } = await getAdmin().rpc('cash_out', { p_user: user.id, p_round: round.nonce, p_deck: deck, p_auto_only: auto === true });
    if (error) throw httpError(400, 'Cash-out failed.');
    const row = Array.isArray(data) ? data[0] : data;

    // The multiplier and payout are decided by the server clock, never by the browser.
    return ok({
      result: row.result,
      multiplier: row.multiplier ? Number(row.multiplier) : null,
      payout: row.payout ? Number(row.payout) : null,
      balance: row.balance ? Number(row.balance) : null,
    });
  } catch (e) {
    return fail(e);
  }
}
