import { NextResponse } from 'next/server';
import { fail } from '../../../../lib/http';
import { requireUser } from '../../../../lib/serverAuth';
import { buildState } from '../../../../lib/game';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await requireUser(request);
    return NextResponse.json(await buildState(user.id), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return fail(e);
  }
}
