import { Waves, Coffee, Bike, Gamepad2, Trees, Umbrella } from 'lucide-react';

const LEISURE_ITEMS = [
  {
    icon: Waves,
    title: 'Piscina com cascata',
    description: 'Área de relaxamento com vista para o mar e espreguiçadeiras.',
  },
  {
    icon: Coffee,
    title: 'Terraço panorâmico',
    description: 'Café da manhã farto servido de frente para a Praia da Vila.',
  },
  {
    icon: Umbrella,
    title: 'Bar na beira da praia',
    description: 'Drinks e petiscos com mesas e guarda-sóis na areia.',
  },
  {
    icon: Bike,
    title: 'Bicicletas grátis',
    description: 'Explore Saquarema com mobilidade e contato com a natureza.',
  },
  {
    icon: Gamepad2,
    title: 'Salão de jogos e parquinho',
    description: 'Lazer para adultos e crianças com pula-pula e jogos.',
  },
  {
    icon: Trees,
    title: 'Churrasqueira & espaço verde',
    description: 'Ambiente ideal para curtir com a família após a praia.',
  },
];

export default function LeisureSection() {
  return (
    <section id="lazer" className="section bg-[var(--color-surface)]" aria-labelledby="lazer-heading">
      <div className="container-wide">
        <div className="max-w-2xl mb-10">
          <p className="text-[var(--color-primary)] mb-2 uppercase tracking-[0.1em] font-bold" style={{ fontSize: 'var(--text-xs)' }}>
            Lazer e infraestrutura
          </p>
          <h2 id="lazer-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
            Estrutura completa para dias leves e memoráveis
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {LEISURE_ITEMS.map(({ icon: Icon, title, description }) => (
            <article key={title} className="card p-5 hover:-translate-y-1 transition-all">
              <div className="h-10 w-10 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center mb-3">
                <Icon size={18} aria-hidden="true" />
              </div>
              <h3 className="mb-2" style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>{title}</h3>
              <p className="text-[var(--color-text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
