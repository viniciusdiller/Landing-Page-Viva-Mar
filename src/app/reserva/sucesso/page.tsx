import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function ReservaSucessoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--color-bg)] px-4 text-center">
      <CheckCircle2
        size={64}
        strokeWidth={1.3}
        className="text-[var(--color-success)]"
      />
      <h1 className="text-xl font-semibold text-[var(--color-text)] md:text-2xl">
        Pagamento aprovado!
      </h1>
      <p className="max-w-md text-[var(--color-text-muted)]">
        Sua reserva foi confirmada e já está sendo processada. Você vai
        receber os detalhes por e-mail em instantes.
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
