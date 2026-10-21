import { NextResponse } from 'next/server';

export function ok(body = {}) {
  return NextResponse.json({ success: true, ...body });
}

export function fail(err) {
  const status = err?.status || 500;
  if (!err?.status) console.error(err);
  return NextResponse.json(
    { success: false, message: err?.status ? err.message : 'Something went wrong. Please try again.' },
    { status }
  );
}
