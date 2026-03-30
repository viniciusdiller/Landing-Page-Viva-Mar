'use client';

import { LayoutDashboard, GitBranch, BarChart3, CalendarCheck, CreditCard, Bell, Globe, Lock } from 'lucide-react';

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard Unificado',
    desc: 'Visão 360° da pousada: ocupação, receita e tarefas num único painel.',
  },
  {
    icon: GitBranch,
    title: 'Channel Manager',
    desc: 'Sincroniza disponibilidade e preços com Booking.com, Airbnb e mais em tempo real.',
  },
  {
    icon: BarChart3,
    title: 'Gestão Financeira',
    desc: 'DRE automático, contas a pagar/receber e relatórios de receita por período.',
  },
  {
    icon: CalendarCheck,
    title: 'Calendário de Reservas',
    desc: 'Timeline visual de todas as reservas com drag & drop para manutenções e bloqueios.',
  },
  {
    icon: CreditCard,
    title: 'Cobranças Integradas',
    desc: 'PIX e cartão via Mercado Pago. Webhook automático confirma a reserva após pagamento.',
  },
  {
    icon: Bell,
    title: 'Notificações Automáticas',
    desc: 'E-mail e WhatsApp para o hóspede no check-in, lembrete de saída e avaliação.',
  },
  {
    icon: Globe,
    title: 'Motor de Reservas Próprio',
    desc: 'Esta página é o motor de reservas. Configure e publique em minutos, sem comissões.',
  },
  {
    icon: Lock,
    title: 'Multi-tenant Seguro',
    desc: 'Cada pousada tem seu tenant isolado. Dados, webhooks e APIs completamente separados.',
  },
];

export default function SaasFeatures() {
  return (
    <section
      id="saas"
      className="section"
      style={{ background: 'var(--color-text)' }}
      aria-labelledby="saas-heading"
    >
      <div className="container-wide">
        {/* Header */}
        <div className="mb-14 max-w-2xl">
          <p
            className="mb-3"
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
            }}
          >
            Para Hoteleiros
          </p>
          <h2
            id="saas-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 600,
              color: 'white',
              marginBottom: '1rem',
            }}
          >
            O que roda por trás desta página
          </h2>
          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'oklch(0.85 0 0)',
              lineHeight: 1.7,
              maxWidth: '56ch',
            }}
          >
            Esta landing page é gerada pelo SaaS de Gestão Hoteleira. Cada reserva feita aqui
            passa pelo Channel Manager, pelo gateway de pagamento e chega ao painel do hoteleiro
            em segundos.
          </p>
        </div>

        {/* Features grid — 2+2+2+2 assimmétrico */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'oklch(1 0 0 / 0.06)' }}>
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="p-6 group"
              style={{
                background: 'var(--color-text)',
                transition: 'background var(--transition)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#262420')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-text)')}
            >
              <Icon
                size={22}
                className="mb-4"
                style={{ color: 'var(--color-accent)' }}
                aria-hidden="true"
              />
              <h3
                className="mb-2 text-white"
                style={{ fontSize: 'var(--text-base)', fontWeight: 600, lineHeight: 1.3 }}
              >
                {title}
              </h3>
              <p
                style={{ fontSize: 'var(--text-sm)', color: 'oklch(0.72 0 0)', lineHeight: 1.65 }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <a
            href="/admin"
            className="btn btn-primary btn-lg"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-text)',
            }}
          >
            Acessar o Painel
          </a>
          <a
            href="#footer"
            className="text-white/60 hover:text-white transition-colors"
            style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}
          >
            Saber mais sobre o SaaS →
          </a>
        </div>
      </div>
    </section>
  );
}
