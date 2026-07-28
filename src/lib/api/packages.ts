import type { Package, PublicAddonApiItem } from "@/types";

type PublicAddonsEnvelope =
  | PublicAddonApiItem[]
  | {
      data?: PublicAddonApiItem[];
      addons?: PublicAddonApiItem[];
      items?: PublicAddonApiItem[];
    };

function getBaseUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_VIVAMAR_API_URL ?? process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error(
      "Defina NEXT_PUBLIC_VIVAMAR_API_URL para consumir a API pública da Viva Mar.",
    );
  }

  return baseUrl.replace(/\/$/, "");
}

function unwrapAddons(payload: PublicAddonsEnvelope): PublicAddonApiItem[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.addons)) {
    return payload.addons;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  return [];
}

function toPackage(addon: PublicAddonApiItem): Package {
  return {
    id: String(addon.id),
    name: addon.name,
    description: addon.description ?? "",
    price: Number(addon.price),
  };
}

/**
 * Busca os pacotes e adicionais disponíveis para reserva, a partir da API
 * pública da Viva Mar (GET /api/public/addons).
 */
export async function fetchPackages(): Promise<Package[]> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/public/addons`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Falha ao carregar pacotes e adicionais (${response.status} ${response.statusText}).`,
    );
  }

  const payload = (await response.json()) as PublicAddonsEnvelope;

  return unwrapAddons(payload).map(toPackage);
}

/**
 * Busca um pacote específico pelo ID, dentro da lista já carregada.
 */
export function getPackageById(
  packages: Package[],
  id: string,
): Package | undefined {
  return packages.find((pkg) => pkg.id === id);
}

/**
 * Calcula o valor total de um conjunto de pacotes selecionados.
 */
export function calculatePackagesTotal(
  packages: Package[],
  selectedPackages: Array<{ id: string; quantity: number }>,
): number {
  return selectedPackages.reduce((total, selected) => {
    const pkg = getPackageById(packages, selected.id);
    return total + (pkg ? pkg.price * selected.quantity : 0);
  }, 0);
}
