import { getAdmin } from '../../../lib/supabaseAdmin';
import { ok, fail } from '../../../lib/http';
import { requireUser, httpError, localPhone } from '../../../lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await requireUser(request);
    const { displayName, phone } = await request.json();
    let mpesaPhone;
    try { mpesaPhone = localPhone(phone); } catch { throw httpError(400, 'Enter a valid M-Pesa phone number.'); }

    const admin = getAdmin();
    const { data: taken } = await admin.from('profiles').select('id').eq('mpesa_phone', mpesaPhone).neq('id', user.id).maybeSingle();
    if (taken) throw httpError(409, 'That phone number is already registered.');

    const { error } = await admin
      .from('profiles')
      .update({ display_name: String(displayName || '').trim().slice(0, 40), mpesa_phone: mpesaPhone })
      .eq('id', user.id);
    if (error) throw httpError(400, 'Could not update profile.');
    return ok({});
  } catch (e) {
    return fail(e);
  }
}
