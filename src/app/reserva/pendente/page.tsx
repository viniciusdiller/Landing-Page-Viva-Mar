import Link from "next/link";
import { Clock } from "lucide-react";

export default function ReservaPendentePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--color-bg)] px-4 text-center">
      <Clock size={64} strokeWidth={1.3} className="text-amber-500" />
      <h1 className="text-xl font-semibold text-[var(--color-text)] md:text-2xl">
        Pagamento em análise
      </h1>
      <p className="max-w-md text-[var(--color-text-muted)]">
        Seu pagamento está sendo processado pelo Mercado Pago (comum em Pix ou
        boleto). Assim que for aprovado, sua reserva é confirmada
        automaticamente e você recebe os detalhes por e-mail.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-12 items-center justify-center bg-[var(--color-primary)] px-8 font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
      >
        VOLTAR AO INÍCIO
      </Link>
    </main>
  );
}
