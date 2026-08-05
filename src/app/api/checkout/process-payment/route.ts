import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createPayment } from "@/lib/mercadopago";
import { computeAuthoritativePrice, PricingError } from "@/lib/pricing";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import type { ProcessPaymentRequest } from "@/types";

function getSiteUrl(): string | null {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  return siteUrl ? siteUrl.replace(/\/$/, "") : null;
}

// Tolerância pra diferenças de arredondamento entre o total exibido no
// front (calculado com os mesmos dados, só que possivelmente já um pouco
// desatualizado) e o total autoritativo recalculado agora no servidor.
const PRICE_TOLERANCE_BRL = 0.01;

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(getClientIp(request), "process-payment", {
    limit: 8,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const { formData, booking, deviceId } = (await request.json()) as ProcessPaymentRequest;

    if (!booking?.roomId || !booking.checkIn || !booking.checkOut || !booking.guest?.email) {
      return NextResponse.json({ error: "Dados de reserva incompletos." }, { status: 400 });
    }

    if (!formData || typeof formData !== "object") {
      return NextResponse.json({ error: "Dados de pagamento ausentes." }, { status: 400 });
    }

    // Nunca confiamos no total calculado no navegador — recalcula tudo a
    // partir do preço real do quarto/pacotes/cupom no Saas-Sancho, e é esse
    // valor (não o que o cliente mandou) que efetivamente é cobrado.
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

    const payment = await createPayment({
      formData,
      transactionAmount: Number(authoritativePrice.total.toFixed(2)),
      description: `${booking.roomName} — ${booking.nights} noite(s)`,
      externalReference,
      notificationUrl: siteUrl ? `${siteUrl}/api/webhooks/mercadopago` : undefined,
      deviceId,
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

    return NextResponse.json(
      {
        status: payment.status,
        statusDetail: payment.statusDetail,
        paymentId: payment.id,
        externalReference,
        qrCode: payment.qrCode,
        qrCodeBase64: payment.qrCodeBase64,
        ticketUrl: payment.ticketUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    // Log detalhado só no servidor — o cliente recebe uma mensagem genérica
    // pra não vazar detalhes internos (config, infraestrutura, respostas
    // cruas do Mercado Pago).
    console.error("Erro ao processar pagamento:", error);
    return NextResponse.json(
      { error: "Não foi possível processar o pagamento. Tente novamente." },
      { status: 500 },
    );
  }
}
