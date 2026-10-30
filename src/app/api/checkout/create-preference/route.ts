import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createCheckoutPreference } from "@/lib/mercadopago";
import { computeAuthoritativePrice, PricingError } from "@/lib/pricing";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { validateBookingPayload } from "@/lib/validators";
import type { CreatePreferenceRequest, CheckoutSessionRequest } from "@/types";

function getSiteUrl(): string | null {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  return siteUrl ? siteUrl.replace(/\/$/, "") : null;
}

const PRICE_TOLERANCE_BRL = 0.01;

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const ipLimit = checkRateLimit(clientIp, "create-preference-ip", {
    limit: 10,
    windowMs: 300_000,
  });
  if (!ipLimit.allowed) {
    return rateLimitResponse(ipLimit, "Muitas tentativas de criação de checkout. Aguarde alguns minutos.");
  }

  try {
    const rawBody = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        { error: "Payload da requisição inválido." },
        { status: 400 },
      );
    }

    const { booking: rawBooking } = rawBody as CreatePreferenceRequest;
    const validation = validateBookingPayload(rawBooking);
    if (!validation.valid || !validation.sanitized) {
      return NextResponse.json(
        { error: validation.error || "Dados de reserva inválidos." },
        { status: 400 },
      );
    }

    const booking = validation.sanitized as CheckoutSessionRequest;

    const emailLimit = checkRateLimit(
      booking.guest.email,
      "create-preference-email",
      {
        limit: 10,
        windowMs: 300_000,
      },
    );
    if (!emailLimit.allowed) {
      return rateLimitResponse(emailLimit, "Limite de checkouts para este e-mail atingido. Aguarde alguns minutos.");
    }

    let authoritativePrice;
    try {
      authoritativePrice = await computeAuthoritativePrice(booking);
    } catch (pricingError) {
      if (pricingError instanceof PricingError) {
        return NextResponse.json(
          { error: pricingError.message },
          { status: 409 },
        );
      }
      throw pricingError;
    }

    if (
      Math.abs(authoritativePrice.total - Number(booking.total)) >
      PRICE_TOLERANCE_BRL
    ) {
      return NextResponse.json(
        {
          error:
            "O valor da reserva mudou. Atualize a página e tente novamente.",
        },
        { status: 409 },
      );
    }

    const siteUrl = getSiteUrl();
    const externalReference = randomUUID();

    const preferenceId = await createCheckoutPreference({
      items: [
        {
          title: `${booking.roomName} — ${booking.nights} noite(s)`,
          quantity: 1,
          unitPrice: Number(authoritativePrice.total.toFixed(2)),
        },
      ],
      payerEmail: booking.guest.email,
      externalReference,
      notificationUrl: siteUrl
        ? `${siteUrl}/api/webhooks/mercadopago`
        : undefined,
      metadata: {
        room_id: booking.roomId,
        room_name: booking.roomName,
        check_in: booking.checkIn,
        check_out: booking.checkOut,
        guests: booking.guests,
        guest_first_name: booking.guest.firstName,
        guest_last_name: booking.guest.lastName,
        guest_email: booking.guest.email,
        guest_phone: booking.guest.phone,
        guest_cpf: booking.guest.cpf || "",
        guest_cep: booking.guest.cep || "",
        guest_address: booking.guest.address || "",
        guest_address_number: booking.guest.addressNumber || "",
        guest_address_complement: booking.guest.addressComplement || "",
        guest_neighborhood: booking.guest.neighborhood || "",
        guest_city: booking.guest.city || "",
        guest_state: booking.guest.state || "",
        special_requests: booking.guest.specialRequests || "",
        coupon_code: booking.discountCode || "",
        packages_json: JSON.stringify(
          (booking.packages || [])
            .filter((pkg) => pkg.quantity > 0)
            .map((pkg) => ({
              name: pkg.name,
              quantity: pkg.quantity,
              price: pkg.price,
            })),
        ),
        total: authoritativePrice.total,
      },
    });

    return NextResponse.json({ preferenceId }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar preferência do Mercado Pago:", error);
    return NextResponse.json(
      { error: "Não foi possível preparar o pagamento. Tente novamente." },
      { status: 500 },
    );
  }
}
