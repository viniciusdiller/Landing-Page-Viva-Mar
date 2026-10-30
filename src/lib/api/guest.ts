export interface GuestReservation {
  reservationId: string; roomId: string; roomName: string; checkIn: string; checkOut: string;
  status: string; amount: number; currency: string; guestName: string; guestEmail: string;
  minStayNights: number; canModify: boolean;
}
export interface GuestResult { ok: boolean; token?: string; reservations?: GuestReservation[]; message?: string; error?: string }
function base() {
  const value = process.env.NEXT_PUBLIC_VIVAMAR_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!value) throw new Error('Portal temporariamente indisponível. Contate a recepção.');
  return value.replace(/\/$/, '');
}
export async function guestRequest(action: 'lookup' | 'list' | 'cancel' | 'reschedule' | 'voucher', token?: string, body?: Record<string, string>): Promise<GuestResult> {
  const path = action === 'lookup' ? 'auth/lookup' : `reservations${action === 'list' ? '' : `/${action}`}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${base()}/api/public/guest/${path}`, {
      method: action === 'list' ? 'GET' : 'POST', cache: 'no-store', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(action === 'list' ? {} : { body: JSON.stringify(body || {}) }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || 'Não foi possível concluir a solicitação.');
    return action === 'list' ? { ok: true, reservations: data } : data;
  } finally { clearTimeout(timer); }
}
