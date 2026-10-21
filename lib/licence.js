import { httpError } from './serverAuth';

// Real-money endpoints stay off until a BCLB licence number is configured.
// This is a safeguard, not a substitute for actually holding a licence.
export const LICENCE_NO = process.env.NEXT_PUBLIC_BCLB_LICENCE_NO || '';

export function requireLicence() {
  if (!LICENCE_NO.trim()) {
    throw httpError(503, 'Real-money play is not enabled yet.');
  }
}
