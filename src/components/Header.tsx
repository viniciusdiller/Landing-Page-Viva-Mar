'use client';

import { useState } from 'react';
import { Menu, X, Waves } from 'lucide-react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Quartos', href: '#quartos' },
    { label: 'Comodidades', href: '#comodidades' },
    { label: 'Para Hoteleiros', href: '#saas' },
    { label: 'Contato', href: '#footer' },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/90 backdrop-blur-md"
      style={{ boxShadow: '0 1px 0 oklch(0.35 0.01 80 / 0.08)' }}
    >
      <div className="container-wide">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group" aria-label="Pousada Viva Mar">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
              className="text-[var(--color-primary)]"
            >
              {/* Onda estilizada + sol */}
              <circle cx="16" cy="11" r="5" fill="currentColor" opacity="0.15" />
              <circle cx="16" cy="11" r="3" fill="currentColor" />
              <path
                d="M4 22 Q8 18 12 22 Q16 26 20 22 Q24 18 28 22"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M4 27 Q8 23 12 27 Q16 31 20 27 Q24 23 28 27"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                opacity="0.5"
              />
            </svg>
            <span
              className="text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              Viva Mar
            </span>
          </a>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Navegação principal">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="hidden md:inline-flex btn btn-ghost"
              style={{ padding: '0.4rem 0.9rem', fontSize: 'var(--text-sm)' }}
            >
              Login
            </a>
            {/* Hamburger mobile */}
            <button
              className="md:hidden p-2 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-offset)] transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav
            className="md:hidden border-t border-[var(--color-border)] py-4 flex flex-col gap-1"
            aria-label="Menu mobile"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-2 py-3 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-offset)] rounded-md transition-colors"
                style={{ fontSize: 'var(--text-base)', fontWeight: 500 }}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/admin"
              className="btn btn-ghost mt-2"
              style={{ justifyContent: 'center' }}
            >
              Login no Painel
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
