import { NextResponse } from "next/server";
import { getPayment } from "@/lib/mercadopago";

// Usado pelo front pra fazer polling enquanto o cliente ainda não escaneou/
// pagou o QR code do Pix (o pagamento nasce "pending" e só muda de status
// quando o Pix é efetivamente pago).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payment = await getPayment(id);

    return NextResponse.json({ status: payment.status }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao consultar pagamento" },
      { status: 500 },
    );
  }
}
