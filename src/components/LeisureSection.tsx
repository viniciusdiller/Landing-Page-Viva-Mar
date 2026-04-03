import { Waves, Coffee, Bike, Gamepad2, Trees, Umbrella } from "lucide-react";

const LEISURE_ITEMS = [
  {
    icon: Waves,
    title: "Piscina com cascata",
    description: "Área de relaxamento com vista para o mar e espreguiçadeiras.",
  },
  {
    icon: Coffee,
    title: "Terraço panorâmico",
    description: "Café da manhã farto servido de frente para a Praia da Vila.",
  },
  {
    icon: Umbrella,
    title: "Bar na beira da praia",
    description: "Drinks e petiscos com mesas e guarda-sóis na areia.",
  },
  {
    icon: Bike,
    title: "Bicicletas grátis",
    description: "Explore Saquarema com mobilidade e contato com a natureza.",
  },
  {
    icon: Gamepad2,
    title: "Salão de jogos e parque",
    description: "Lazer para adultos e crianças com pula-pula e jogos.",
  },
  {
    icon: Trees,
    title: "Churrasqueira & Jardim",
    description: "Ambiente ideal para curtir com a família após a praia.",
  },
];

export default function LeisureSection() {
  return (
    <section
      id="lazer"
      className="py-20 md:py-32 bg-white"
      aria-labelledby="lazer-heading"
    >
      <div className="container-wide max-w-[90rem] mx-auto px-4 md:px-8">
        {/* Cabeçalho centralizado seguindo a nova identidade */}
        <div className="text-center mb-16 md:mb-24">
          <h2
            id="lazer-heading"
            className="text-[#2f3134] uppercase mb-4"
            style={{
              fontSize: "clamp(1.25rem, 2vw, 2.1rem)",
              letterSpacing: "0.36em",
              fontWeight: 500,
              fontFamily: "var(--font-body)",
            }}
          >
            Lazer & Infraestrutura
          </h2>
          <p className="text-gray-500 text-xs md:text-sm tracking-[0.2em] uppercase">
            Estrutura completa para dias memoráveis
          </p>
        </div>

        {/* Grade Editorial Minimalista */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
          {LEISURE_ITEMS.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="group border-t border-gray-200 pt-6 transition-colors hover:border-black"
            >
              {/* Ícone com traço fino */}
              <Icon
                size={28}
                strokeWidth={1.2}
                className="text-black mb-6 transform transition-transform duration-500 group-hover:-translate-y-1"
                aria-hidden="true"
              />

              {/* Título com espaçamento de letras */}
              <h3 className="text-black uppercase text-xs tracking-[0.2em] font-semibold mb-3">
                {title}
              </h3>

              {/* Descrição em tom suave */}
              <p className="text-gray-500 text-sm leading-relaxed">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
