export default function WelcomeIntro() {
  return (
    <section className="bg-[var(--color-bg)] py-16 md:py-24 text-center">
      <div className="container-wide max-w-3xl mx-auto px-4">
        <p
          className="uppercase text-[var(--color-text-muted)]"
          style={{ fontSize: "var(--text-xs)", letterSpacing: "0.3em", fontWeight: 500 }}
        >
          Seja bem-vindo à
        </p>
        <h2
          className="mt-3 uppercase text-[var(--color-text)]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.8rem, 3.5vw, 2.75rem)",
            fontWeight: 600,
          }}
        >
          Pousada Viva Mar
        </h2>
        <div className="mt-5 mb-6 h-px w-14 bg-[var(--color-primary)] mx-auto" />
        <p
          className="text-[var(--color-text-muted)] leading-relaxed"
          style={{ fontSize: "var(--text-base)" }}
        >
          Um lugar para relaxar, curtir a natureza e viver dias incríveis em
          Saquarema. Estrutura completa para você e sua família.
        </p>
      </div>
    </section>
  );
}
