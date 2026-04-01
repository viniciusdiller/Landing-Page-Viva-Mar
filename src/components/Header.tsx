"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "Inicio", href: "#hero" },
    { label: "Hospedagem", href: "#quartos" },
    { label: "Gastronomia", href: "#lazer" },
    { label: "Contato", href: "#footer" },
    { label: "Blog", href: "#" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/35 backdrop-blur-md">
      <div className="container-wide">
        <div className="flex items-center justify-between h-20">
          <a
            href="#hero"
            className="flex items-center gap-2 group"
            aria-label="Pousada Viva Mar"
          >
            <img
              src="/Logo-Viva-Mar.jpeg"
              alt="Logo Pousada Viva Mar"
              width={40}
              height={40}
            />
            <div>
              <p className="leading-none font-semibold text-white group-hover:text-[var(--color-primary-light)] transition-colors">
                Pousada Viva Mar
              </p>
              <p className="leading-none mt-1 text-[10px] tracking-[0.12em] uppercase text-white/65">
                Saquarema • RJ
              </p>
            </div>
          </a>

          <nav
            className="hidden md:flex items-center gap-7"
            aria-label="Navegação principal"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-white/80 hover:text-white transition-colors"
                style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#hero"
              className="hidden md:inline-flex h-10 px-5 items-center justify-center font-semibold tracking-wide text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              RESERVAR
            </a>
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-white/90 hover:text-white hover:bg-white/10"
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
            className="md:hidden border-t border-white/10 py-4 flex flex-col gap-1"
            aria-label="Menu mobile"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-2 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#hero"
              className="mt-2 h-11 inline-flex items-center justify-center rounded-md text-white font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
            >
              RESERVAR
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
