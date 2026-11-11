import type { GuestAuthResponse, GuestReservation } from "@/types";

function getBaseUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_VIVAMAR_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3003";

  return baseUrl.replace(/\/$/, "");
}

export async function lookupGuestReservation(
  code: string,
  identifier: string
): Promise<GuestAuthResponse> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/public/guest/auth/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, identifier }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data.error || "Reserva não encontrada. Verifique os dados digitados." };
    }
    return {
      ok: true,
      token: data.token,
      guest: data.guest,
      reservations: data.reservations,
    };
  } catch {
    return { ok: false, error: "Falha de conexão com o servidor. Tente novamente." };
  }
}

export async function fetchGuestReservations(token: string): Promise<GuestReservation[]> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/public/guest/reservations`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("fetchGuestReservations erro de rede:", err);
    return [];
  }
}

export async function cancelGuestReservation(
  token: string,
  reservationId: string | number
): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/public/guest/reservations/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reservationId }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data.error || "Não foi possível cancelar a reserva." };
    }
    return { ok: true, message: data.message };
  } catch {
    return { ok: false, error: "Falha de conexão ao cancelar reserva." };
  }
}

export async function rescheduleGuestReservation(
  token: string,
  reservationId: string | number,
  newCheckIn: string,
  newCheckOut: string
): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/public/guest/reservations/reschedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reservationId, newCheckIn, newCheckOut }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data.error || "Não foi possível remarcar a reserva." };
    }
    return { ok: true, message: data.message };
  } catch {
    return { ok: false, error: "Falha de conexão ao remarcar reserva." };
  }
}

export async function resendGuestVoucher(
  token: string,
  reservationId: string | number
): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/public/guest/reservations/voucher`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reservationId }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data.error || "Não foi possível reenviar o voucher." };
    }
    return { ok: true, message: data.message };
  } catch {
    return { ok: false, error: "Falha de conexão ao reenviar voucher." };
  }
}

