import type { GalleryPhoto, PublicGalleryPhotoApiItem } from "@/types";

type PublicGalleryEnvelope =
  | PublicGalleryPhotoApiItem[]
  | {
      data?: PublicGalleryPhotoApiItem[];
      photos?: PublicGalleryPhotoApiItem[];
      items?: PublicGalleryPhotoApiItem[];
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

function normalizePhotoUrl(url: string, baseUrl: string) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${normalizedPath}`;
}

function unwrapPhotos(payload: PublicGalleryEnvelope): PublicGalleryPhotoApiItem[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.photos)) {
    return payload.photos;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  return [];
}

export async function fetchPublicGallery(): Promise<GalleryPhoto[]> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/public/gallery`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Falha ao carregar galeria (${response.status} ${response.statusText}).`,
    );
  }

  const payload = (await response.json()) as PublicGalleryEnvelope;

  return unwrapPhotos(payload)
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((photo) => ({
      id: photo.id,
      url: normalizePhotoUrl(photo.url, baseUrl),
      caption: photo.caption,
    }));
}
