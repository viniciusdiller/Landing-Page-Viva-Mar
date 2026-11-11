"use client";

import { useEffect, useState } from "react";
import { Menu, X, User } from "lucide-react";
import { useGuest } from "@/lib/guest-context";

const SCROLL_THRESHOLD = 60;

function WaveMark() {
  return (
    <svg
      width="20"
      height="40"
      viewBox="0 0 20 40"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="wave-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fd0f5" />
          <stop offset="100%" stopColor="#1b4fb8" />
        </linearGradient>
      </defs>
      <path
        d="M4 2C11 7 -1 12 6 17C13 22 1 27 8 32C12 34.5 10 36.5 7 38"
        stroke="url(#wave-gradient)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Header() {
  const { isAuthenticated, openPortal } = useGuest();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const solid = scrolled || menuOpen;

  const navLinks = [
    { label: "A Pousada", href: "#hero" },
    { label: "Acomodações", href: "#quartos" },
    { label: "Estrutura", href: "#lazer" },
    { label: "Galeria", href: "#galeria" },
    { label: "Localização", href: "#mapa" },
    { label: "Contato", href: "#footer" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        solid
          ? "bg-[var(--color-bg)]/95 backdrop-blur-md border-b border-[var(--color-border)] shadow-sm"
          : "bg-gradient-to-b from-black/25 via-black/8 to-transparent border-b border-transparent"
      }`}
    >
      <div className="container-wide">
        <div className="flex items-center justify-between h-20">
          <a
            href="#hero"
            className="flex items-center gap-1.5 group"
            aria-label="Pousada Viva Mar"
          >
            <WaveMark />
            <div>
              <p
                className={`uppercase font-semibold transition-colors ${
                  solid ? "text-[var(--color-text)]" : "text-white"
                }`}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.15rem",
                  lineHeight: 0.92,
                  letterSpacing: "0.02em",
                  textShadow: solid ? undefined : "0 1px 8px rgba(0,0,0,0.4)",
                }}
              >
                Viva
                <br />
                Mar
              </p>
              <p
                className={`leading-none mt-1.5 text-[8px] tracking-[0.35em] uppercase transition-colors ${
                  solid ? "text-[var(--color-text-muted)]" : "text-white/70"
                }`}
                style={{ textShadow: solid ? undefined : "0 1px 6px rgba(0,0,0,0.4)" }}
              >
                Pousada
              </p>
            </div>
          </a>

          <nav
            className="hidden lg:flex items-center gap-6 xl:gap-8"
            aria-label="Navegação principal"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`uppercase tracking-[0.14em] transition-colors ${
                  solid
                    ? "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    : "text-white/85 hover:text-white"
                }`}
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 500,
                  textShadow: solid ? undefined : "0 1px 6px rgba(0,0,0,0.4)",
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openPortal}
              className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium shadow-sm backdrop-blur-sm transition-all duration-200 active:scale-95 cursor-pointer ${
                solid
                  ? "border-[#d6ceb8] bg-white/90 text-[#292a24] hover:border-[#454a3a] hover:bg-[#454a3a] hover:text-white hover:shadow-md"
                  : "border-white/30 bg-black/20 text-white hover:border-white/70 hover:bg-white hover:text-[#292a24] hover:shadow-md"
              }`}
            >
              <User
                className={`size-3.5 text-[#bd9a5f] transition-transform duration-200 group-hover:scale-110 ${
                  solid ? "group-hover:text-[#f1e6cf]" : ""
                }`}
              />
              <span className="hidden sm:inline transition-colors duration-200">
                {isAuthenticated ? "Minha Conta" : "Minhas Reservas"}
              </span>
            </button>
            <a
              href="#quartos"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-xs font-medium tracking-wide text-white shadow-sm transition-all hover:bg-[var(--color-primary-hover)] hover:shadow-md active:scale-95"
            >
              Reservar estadia
            </a>
            <button
              type="button"
              className={`lg:hidden p-2 rounded-md transition-colors ${
                solid
                  ? "text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                  : "text-white hover:bg-white/10"
              }`}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            className="lg:hidden border-t border-[var(--color-border)] py-4 flex flex-col gap-1"
            aria-label="Menu mobile"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-2 py-3 uppercase tracking-[0.14em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-md"
                style={{ fontSize: "var(--text-xs)" }}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openPortal();
                }}
                className="group flex items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-white py-3 text-sm font-medium text-[var(--color-text)] transition-all duration-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:shadow-md active:scale-95 cursor-pointer"
              >
                <User className="size-4 text-[var(--color-accent)] transition-transform duration-200 group-hover:scale-110 group-hover:text-white" />
                <span className="transition-colors duration-200">
                  {isAuthenticated ? "Minha Conta" : "Minhas Reservas"}
                </span>
              </button>
              <a
                href="#quartos"
                className="text-center rounded-full bg-[var(--color-primary)] py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] active:scale-95"
                onClick={() => setMenuOpen(false)}
              >
                Reservar estadia
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
