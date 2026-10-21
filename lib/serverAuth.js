import { getAdmin } from './supabaseAdmin';

// Resolves the signed-in user from the "Authorization: Bearer <access_token>" header.
export async function requireUser(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw httpError(401, 'Please sign in.');
  const { data, error } = await getAdmin().auth.getUser(token);
  if (error || !data?.user) throw httpError(401, 'Session expired. Please sign in again.');
  return data.user;
}

export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export function normalizePhone(phone) {
  let clean = String(phone || '').trim().replace(/\s+/g, '');
  if (clean.startsWith('+')) clean = clean.slice(1);
  if (clean.startsWith('0')) clean = `254${clean.slice(1)}`;
  if (!/^254(7|1)\d{8}$/.test(clean)) throw httpError(400, 'Invalid M-Pesa phone number.');
  return clean;
}

export function localPhone(phone) {
  const n = normalizePhone(phone);
  return `0${n.slice(3)}`;
}
