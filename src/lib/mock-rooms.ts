const API = process.env.NEXT_PUBLIC_API_URL;
import type { RoomAmenity, RoomType } from "@/types";

function normalizeAmenityIcon(icon?: string): string {
  if (!icon) return "wifi";

  const normalized = icon.toLowerCase().trim();
  const aliases: Record<string, string> = {
    parking: "parking-circle",
    parking_circle: "parking-circle",
    air_conditioning: "air-vent",
    airconditioning: "air-vent",
    aircon: "air-vent",
    ac: "air-vent",
    frigobar: "refrigerator",
  };

  return aliases[normalized] ?? normalized;
}

function parseAmenitiesFromRoom(room: any): RoomAmenity[] {
  let raw = room?.amenities ?? room?.roomAmenities ?? room?.features ?? [];

  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = raw
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
  }

  if (!Array.isArray(raw) || raw.length === 0) return [];

  return raw
    .map((amenity: any) => {
      if (typeof amenity === "string") {
        return {
          label: amenity,
          icon: normalizeAmenityIcon(amenity),
        };
      }

      const label = amenity?.label ?? amenity?.name ?? amenity?.title;
      const icon = amenity?.icon ?? amenity?.slug ?? amenity?.code;

      if (!label) return null;

      return {
        label: String(label),
        icon: normalizeAmenityIcon(icon ?? label),
      };
    })
    .filter(Boolean) as RoomAmenity[];
}

export async function fetchRooms(params?: {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}) {
  const { checkIn, checkOut, guests } = params || {};

  let url = `${API}/api/public/viva-mar`;
  const qs: string[] = [];
  if (checkIn && checkOut) {
    qs.push(`checkIn=${checkIn}`, `checkOut=${checkOut}`);
  }
  if (guests && guests > 0) {
    qs.push(`guests=${guests}`);
  }
  if (qs.length > 0) url += `?${qs.join("&")}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    const saasRooms = await response.json();
    return saasRooms
      .map((room: any) => {
        const fallbackAmenities = [
          { label: "Wi-Fi", icon: "wifi" },
          { label: "Estacionamento", icon: "parking-circle" },
          { label: "TV Smart", icon: "tv" },
          { label: "Frigobar", icon: "refrigerator" },
          { label: "Varanda com Rede", icon: "hammock" },
        ];

        if (room.localRoomId === "vm-standard") {
          fallbackAmenities.push({
            label: "Ventilador de Teto",
            icon: "fan",
          });
        } else {
          fallbackAmenities.push({
            label: "Ar Condicionado",
            icon: "snowflake",
          });
        }

        if (room.localRoomId === "vm-duplo-deluxe") {
          fallbackAmenities.push({ label: "Vista Mar", icon: "waves" });
        }

        const amenitiesFromApi = parseAmenitiesFromRoom(room);

        return {
          id: room.id,
          name: room.name,
          capacity: room.maxGuests,
          pricePerNight: Number(room.price),
          images: [`https://picsum.photos/seed/${room.id}/900/675`],
          amenities:
            amenitiesFromApi.length > 0 ? amenitiesFromApi : fallbackAmenities,
          remainingQuantity: room.remainingQuantity,
        };
      })
      .filter((room: any) => {
        if (!guests || guests <= 0) return true;
        return typeof room.capacity === "number" && room.capacity >= guests;
      });
  } catch (error) {
    console.error("Erro ao buscar quartos:", error);
    return [];
  }
}
