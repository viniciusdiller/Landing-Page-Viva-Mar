import type {
  FetchPublicRoomsParams,
  PublicRoomApiItem,
  RoomAmenity,
  RoomType,
} from "@/types";

type PublicRoomsEnvelope =
  | PublicRoomApiItem[]
  | {
      data?: PublicRoomApiItem[];
      rooms?: PublicRoomApiItem[];
      items?: PublicRoomApiItem[];
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

function normalizeAmenityIcon(label: string): string {
  const normalized = label.toLowerCase().trim();
  const aliases: Record<string, string> = {
    wifi: "wifi",
    "wi-fi": "wifi",
    internet: "wifi",
    tv: "tv",
    television: "tv",
    frigobar: "refrigerator",
    refrigerador: "refrigerator",
    geladeira: "refrigerator",
    estacionamento: "parking-circle",
    parking: "parking-circle",
    piscina: "waves",
    mar: "waves",
    varanda: "sun",
    rede: "sun",
    cozinha: "utensils",
    cafeteira: "coffee",
    ventilador: "fan",
    ar: "snowflake",
    "ar-condicionado": "snowflake",
    "ar condicionado": "snowflake",
    banho: "bath",
    banheiro: "bath",
    cama: "bed-double",
  };

  if (aliases[normalized]) {
    return aliases[normalized];
  }

  const token = normalized
    .split(/[^a-z0-9]+/)
    .find((part) => aliases[part]);

  return token ? aliases[token] : "sparkles";
}

function normalizeAmenities(
  amenities: string | null,
  amenitiesList: string[],
): RoomAmenity[] {
  const labels =
    amenitiesList.length > 0
      ? amenitiesList
      : parseAmenitiesString(amenities).map((item) => item.label);

  return labels.map((label) => ({
    label,
    icon: normalizeAmenityIcon(label),
  }));
}

function parseAmenitiesString(value: string | null): RoomAmenity[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (typeof item === "string") {
          return {
            label: item,
            icon: normalizeAmenityIcon(item),
          };
        }

        if (item && typeof item === "object") {
          const label =
            "label" in item
              ? item.label
              : "name" in item
                ? item.name
                : null;

          if (typeof label === "string") {
            return {
              label,
              icon: normalizeAmenityIcon(label),
            };
          }
        }

        return null;
      })
      .filter((item): item is RoomAmenity => item !== null);
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((label) => ({
        label,
        icon: normalizeAmenityIcon(label),
      }));
  }
}

function normalizePhotoUrl(url: string, baseUrl: string) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${normalizedPath}`;
}

function unwrapRooms(payload: PublicRoomsEnvelope): PublicRoomApiItem[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.rooms)) {
    return payload.rooms;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  return [];
}

function toRoomType(
  room: PublicRoomApiItem,
  hasDates: boolean,
  baseUrl: string,
): RoomType {
  const normalizedPhotoUrls = room.photoUrls.map((url) =>
    normalizePhotoUrl(url, baseUrl),
  );
  const remainingQuantity = hasDates ? room.remainingQuantity : room.quantity;
  const amenitiesFromString = parseAmenitiesString(room.amenities);
  const amenities =
    room.amenitiesList.length > 0
      ? normalizeAmenities(room.amenities, room.amenitiesList)
      : amenitiesFromString;

  return {
    id: room.id,
    propertyId: undefined,
    channexRoomTypeId: room.channexRoomTypeId,
    name: room.name,
    description: "",
    maxOccupancy: room.maxGuests,
    pricePerNight: Number(room.price),
    images: normalizedPhotoUrls,
    photoUrls: normalizedPhotoUrls,
    status: room.status,
    quantity: room.quantity,
    remainingQuantity,
    amenities,
    amenitiesList:
      room.amenitiesList.length > 0
        ? room.amenitiesList
        : amenitiesFromString.map((item) => item.label),
    available: remainingQuantity > 0,
    availableUnits: remainingQuantity,
    capacity: room.maxGuests,
    minStayNights: room.minStayNights,
    minStayDays: room.minStayDays,
  };
}

export async function fetchPublicRooms(
  params: FetchPublicRoomsParams = {},
): Promise<RoomType[]> {
  const baseUrl = getBaseUrl();
  const searchParams = new URLSearchParams();
  const hasDates = Boolean(params.checkIn && params.checkOut);

  if (params.checkIn) {
    searchParams.set("checkIn", params.checkIn);
  }

  if (params.checkOut) {
    searchParams.set("checkOut", params.checkOut);
  }

  const query = searchParams.toString();
  const endpoint = `${baseUrl}/api/public/rooms${query ? `?${query}` : ""}`;
  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Falha ao carregar quartos (${response.status} ${response.statusText}).`,
    );
  }

  const payload = (await response.json()) as PublicRoomsEnvelope;

  return unwrapRooms(payload)
    .filter((room) => room.status === "active")
    .sort((first, second) => first.name.localeCompare(second.name, "pt-BR"))
    .map((room) => toRoomType(room, hasDates, baseUrl));
}