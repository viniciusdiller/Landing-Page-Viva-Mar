"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "Quem Somos", href: "#hero" },
    { label: "Acomodações", href: "#quartos" },
    { label: "Lazer", href: "#lazer" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-md border-b border-[var(--color-border)]">
      <div className="container-wide">
        <div className="flex items-center justify-between h-16">
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
              <p className="leading-none font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                Pousada Viva Mar
              </p>
              <p className="leading-none mt-1 text-[10px] tracking-[0.12em] uppercase text-[var(--color-text-faint)]">
                Saquarema • RJ
              </p>
            </div>
          </a>

          <nav
            className="hidden md:flex items-center gap-6"
            aria-label="Navegação principal"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-white transition-colors"
                style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="hidden md:inline-flex btn btn-ghost text-gray-300 hover:text-[#3c91a2]"
              style={{ padding: "0.4rem 0.9rem" }}
            >
              Login
            </a>
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-300 hover:text-[var(--color-text)] hover:bg-[var(--color-surface-offset)]"
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
            className="md:hidden border-t border-[var(--color-border)] py-4 flex flex-col gap-1"
            aria-label="Menu mobile"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-2 py-3 text-gray-300 hover:text-white hover:bg-[var(--color-surface-offset)] rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/admin"
              className="btn btn-ghost mt-2"
              style={{ justifyContent: "center" }}
            >
              Login no Painel
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
