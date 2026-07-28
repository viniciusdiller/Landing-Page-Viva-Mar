import Link from "next/link";
import { XCircle } from "lucide-react";

export default function ReservaErroPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--color-bg)] px-4 text-center">
      <XCircle size={64} strokeWidth={1.3} className="text-red-500" />
      <h1 className="text-xl font-semibold text-[var(--color-text)] md:text-2xl">
        Não foi possível concluir o pagamento
      </h1>
      <p className="max-w-md text-[var(--color-text-muted)]">
        O pagamento foi recusado ou cancelado e nenhuma reserva foi criada.
        Volte para o site e tente novamente, se necessário com outro cartão
        ou forma de pagamento.
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
