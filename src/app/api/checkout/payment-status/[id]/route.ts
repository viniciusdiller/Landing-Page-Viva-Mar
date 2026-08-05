import { NextResponse } from "next/server";
import { getPayment } from "@/lib/mercadopago";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const NUMERIC_ID = /^\d+$/;

// Usado pelo front pra fazer polling enquanto o cliente ainda não escaneou/
// pagou o QR code do Pix (o pagamento nasce "pending" e só muda de status
// quando o Pix é efetivamente pago).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimit = checkRateLimit(getClientIp(request), "payment-status", {
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const { id } = await params;

    if (!NUMERIC_ID.test(id)) {
      return NextResponse.json({ error: "ID de pagamento inválido." }, { status: 400 });
    }

    // Exige o token opaco (externalReference) devolvido na criação do
    // pagamento como prova de posse — sem isso, qualquer pessoa que
    // soubesse/adivinhasse um ID numérico de pagamento conseguiria
    // consultar o status de reservas alheias.
    const token = new URL(request.url).searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    const payment = await getPayment(id);

    if (payment.externalReference !== token) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    return NextResponse.json({ status: payment.status }, { status: 200 });
  } catch (error) {
    console.error("Erro ao consultar status do pagamento:", error);
    return NextResponse.json(
      { error: "Não foi possível consultar o status do pagamento." },
      { status: 500 },
    );
  }
}
