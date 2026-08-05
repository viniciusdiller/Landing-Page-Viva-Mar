import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createCheckoutPreference } from "@/lib/mercadopago";
import { computeAuthoritativePrice, PricingError } from "@/lib/pricing";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import type { CreatePreferenceRequest } from "@/types";

function getSiteUrl(): string | null {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  return siteUrl ? siteUrl.replace(/\/$/, "") : null;
}

const PRICE_TOLERANCE_BRL = 0.01;

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(getClientIp(request), "create-preference", {
    limit: 8,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const { booking } = (await request.json()) as CreatePreferenceRequest;

    if (!booking?.roomId || !booking.checkIn || !booking.checkOut || !booking.guest?.email) {
      return NextResponse.json({ error: "Dados de reserva incompletos." }, { status: 400 });
    }

    // Mesma revalidação de preço da rota de pagamento direto — essa
    // preferência também pode ser usada pra cobrar via carteira Mercado
    // Pago, então não pode confiar no total calculado no navegador.
    let authoritativePrice;
    try {
      authoritativePrice = await computeAuthoritativePrice(booking);
    } catch (pricingError) {
      if (pricingError instanceof PricingError) {
        return NextResponse.json({ error: pricingError.message }, { status: 409 });
      }
      throw pricingError;
    }

    if (
      Math.abs(authoritativePrice.total - Number(booking.total)) > PRICE_TOLERANCE_BRL
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
      notificationUrl: siteUrl ? `${siteUrl}/api/webhooks/mercadopago` : undefined,
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
          booking.packages
            .filter((pkg) => pkg.quantity > 0)
            .map((pkg) => ({ name: pkg.name, quantity: pkg.quantity, price: pkg.price })),
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
