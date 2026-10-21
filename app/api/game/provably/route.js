import { NextResponse } from 'next/server';
import { getAdmin } from '../../../../lib/supabaseAdmin';
import { roundProof, HOUSE_EDGE } from '../../../../lib/game';

export const dynamic = 'force-dynamic';

// Public verification endpoint. Before a round crashes only its commitment
// (sha256 of the round seed) is shown. After the crash the seed is revealed so
// anyone can recompute: crash = f(HMAC_SHA256(seed, "<clientSeed>:<nonce>")).
export async function GET(request) {
  try {
    const nonce = Number(new URL(request.url).searchParams.get('nonce'));
    if (!Number.isInteger(nonce) || nonce < 1) {
      return NextResponse.json({ success: false, message: 'Invalid nonce.' }, { status: 400 });
    }
    const { data: round } = await getAdmin().from('rounds').select('nonce, commitment, crash_at').eq('nonce', nonce).maybeSingle();
    if (!round) return NextResponse.json({ success: false, message: 'Round not found.' }, { status: 404 });

    if (Date.now() < new Date(round.crash_at).getTime()) {
      return NextResponse.json({ success: true, revealed: false, nonce, serverSeedHash: round.commitment, algorithm: 'HMAC_SHA256', houseEdge: HOUSE_EDGE });
    }
    const p = roundProof(nonce);
    return NextResponse.json({
      success: true, revealed: true, nonce,
      serverSeedHash: p.commitment, serverSeed: p.seed, roundHash: p.roundHash,
      clientSeed: p.verifyInput.split(':')[0], verifyInput: p.verifyInput,
      crashPoint: p.crashPoint, algorithm: 'HMAC_SHA256', houseEdge: HOUSE_EDGE,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, message: 'Verification unavailable.' }, { status: 500 });
  }
}
