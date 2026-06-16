import type { Package } from "@/types";

/**
 * Pacotes e adicionais disponíveis para todas as reservas.
 * Você pode expandir isso para ser dinâmico (vindo da API) conforme necessário.
 */
export const DEFAULT_PACKAGES: Package[] = [
  {
    id: "decoration",
    name: "Decoração Especial",
    description: "Rosa, velas, pétalas e iluminação ambiente",
    price: 150,
    icon: "sparkles",
  },
  {
    id: "champagne",
    name: "Champanhe Premium",
    description: "Garrafa de Champanhe Français para celebrar",
    price: 120,
    icon: "wine-2",
  },
  {
    id: "breakfast",
    name: "Café da Manhã Especial",
    description: "Café da manhã gourmet entregue no quarto",
    price: 85,
    icon: "coffee",
  },
  {
    id: "massage",
    name: "Massagem Relaxante",
    description: "Massagem de 60 minutos no spa do resort",
    price: 200,
    icon: "hands-praying",
  },
  {
    id: "dinner",
    name: "Jantar Romântico",
    description: "Jantar a dois na praia com atendimento personalizado",
    price: 350,
    icon: "utensils",
  },
  {
    id: "late-checkout",
    name: "Late Checkout",
    description: "Saída às 16h ao invés de 12h",
    price: 75,
    icon: "clock",
  },
];

/**
 * Busca todos os pacotes disponíveis.
 * No futuro, pode fazer uma chamada à API pública.
 */
export async function fetchPackages(): Promise<Package[]> {
  // TODO: Se houver um endpoint público de pacotes, fazer fetch aqui
  // const response = await fetch(`${baseUrl}/api/public/packages`);
  // return response.json();

  // Por enquanto, retorna os pacotes padrão
  return DEFAULT_PACKAGES;
}

/**
 * Busca um pacote específico pelo ID.
 */
export function getPackageById(id: string): Package | undefined {
  return DEFAULT_PACKAGES.find((pkg) => pkg.id === id);
}

/**
 * Calcula o valor total de um conjunto de pacotes selecionados.
 */
export function calculatePackagesTotal(
  selectedPackages: Array<{ id: string; quantity: number }>,
): number {
  return selectedPackages.reduce((total, selected) => {
    const pkg = getPackageById(selected.id);
    return total + (pkg ? pkg.price * selected.quantity : 0);
  }, 0);
}
