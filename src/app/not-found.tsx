import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--color-bg)] px-4 text-center">
      <p
        className="text-[var(--color-primary)]"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(3rem, 10vw, 6rem)",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        404
      </p>
      <h1 className="text-xl font-semibold text-[var(--color-text)] md:text-2xl">
        Esta página não foi encontrada
      </h1>
      <p className="max-w-md text-[var(--color-text-muted)]">
        O endereço acessado não existe ou foi movido. Volte para a página
        inicial da Pousada Viva Mar para continuar navegando.
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
