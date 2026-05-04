// ============================================================
// MOCK DATA — Quartos da Pousada Viva Mar (Saquarema - RJ)
// ============================================================
// Para integrar dados reais, substitua este array pelo retorno
// da sua rota: GET /api/tenant/channex/room-types/route.ts
//
// Mapeamento Channex:
//   id           -> room_type.id
//   propertyId   -> property.id
//   name         -> room_type.attributes.title
//   description  -> room_type.attributes.description
//   maxOccupancy -> room_type.attributes.occupancy
//   pricePerNight-> rate_plan (normalizado para BRL)
// ============================================================
const API = process.env.NEXT_PUBLIC_API_URL;
import type { RoomType } from "@/types";

export const MOCK_ROOMS: RoomType[] = [
  {
    id: "channex-rt-standard",
    propertyId: "channex-prop-vivamar-saquarema",
    name: "Apartamento Standard",
    description:
      "Ambiente acolhedor com varanda e rede para relaxar ao som do mar de Saquarema.",
    maxOccupancy: 3,
    pricePerNight: 240,
    size: "24 m²",
    bedType: "Cama Casal + apoio",
    view: "Vista Jardim",
    availableUnits: 1,
    available: true,
    images: [
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
    ],
    capacity: 3,
    amenities: [
      { icon: "tv", label: "TV Smart" },
      { icon: "refrigerator", label: "Frigobar" },
      { icon: "fan", label: "Ventilador de teto" },
      { icon: "hammock", label: "Varanda com rede" },
      { icon: "wifi", label: "Wi-Fi" },
      { icon: "parking-circle", label: "Estacionamento" },
    ],
  },
  {
    id: "channex-rt-superior",
    propertyId: "channex-prop-vivamar-saquarema",
    name: "Apartamento Superior",
    description:
      "Mais conforto para casais e famílias pequenas, com varanda privativa e climatização.",
    maxOccupancy: 3,
    pricePerNight: 280,
    size: "28 m²",
    bedType: "Cama Queen",
    view: "Vista Piscina",
    availableUnits: 5,
    available: true,
    images: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    ],
    capacity: 3,
    amenities: [
      { icon: "tv", label: "TV Smart" },
      { icon: "refrigerator", label: "Frigobar" },
      { icon: "air-vent", label: "Ar-condicionado" },
      { icon: "hammock", label: "Varanda com rede" },
      { icon: "wifi", label: "Wi-Fi" },
      { icon: "parking-circle", label: "Estacionamento" },
    ],
  },
  {
    id: "channex-rt-deluxe",
    propertyId: "channex-prop-vivamar-saquarema",
    name: "Apartamento Duplo Deluxe",
    description:
      "Suíte com varanda e vista para o mar, cama King Size e experiência premium de hospedagem.",
    maxOccupancy: 2,
    pricePerNight: 320,
    size: "34 m²",
    bedType: "Cama King Size",
    view: "Vista Mar",
    availableUnits: 4,
    available: true,
    images: [
      "https://images.unsplash.com/photo-1616594039964-3f6d7d9b4e46?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
    ],
    capacity: 3,
    amenities: [
      { icon: "tv", label: "TV Smart" },
      { icon: "refrigerator", label: "Frigobar" },
      { icon: "air-vent", label: "Ar-condicionado" },
      { icon: "wifi", label: "Wi-Fi" },
      { icon: "parking-circle", label: "Estacionamento" },
      { icon: "hammock", label: "Varanda com rede" },
      { icon: "waves", label: "Vista mar" },
    ],
  },
  {
    id: "channex-rt-triplo-superior",
    propertyId: "channex-prop-vivamar-saquarema",
    name: "Apartamento Triplo Superior",
    description:
      "Ideal para pequenos grupos, com climatização, varanda com rede e conforto para até 3 hóspedes.",
    maxOccupancy: 3,
    pricePerNight: 0,
    priceOnRequest: true,
    size: "30 m²",
    bedType: "Cama Queen + apoio",
    view: "Vista Piscina",
    availableUnits: 4,
    available: true,
    images: [
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
    ],
    capacity: 3,
    amenities: [
      { icon: "tv", label: "TV Smart" },
      { icon: "refrigerator", label: "Frigobar" },
      { icon: "air-vent", label: "Ar-condicionado" },
      { icon: "hammock", label: "Varanda com rede" },
      { icon: "wifi", label: "Wi-Fi" },
      { icon: "parking-circle", label: "Estacionamento" },
    ],
  },
  {
    id: "channex-rt-triplo-master",
    propertyId: "channex-prop-vivamar-saquarema",
    name: "Apartamento Triplo Master",
    description:
      "Quarto espaçoso para famílias, com varanda com rede, climatização e comodidades completas.",
    maxOccupancy: 3,
    pricePerNight: 0,
    priceOnRequest: true,
    size: "36 m²",
    bedType: "Cama King + apoio",
    view: "Vista Jardim",
    availableUnits: 4,
    available: true,
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
    ],
    capacity: 3,
    amenities: [
      { icon: "tv", label: "TV Smart" },
      { icon: "refrigerator", label: "Frigobar" },
      { icon: "air-vent", label: "Ar-condicionado" },
      { icon: "wifi", label: "Wi-Fi" },
      { icon: "hammock", label: "Varanda com rede" },
      { icon: "parking-circle", label: "Estacionamento" },
    ],
  },
];

export async function fetchRooms(params?: {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}) {
  const { checkIn, checkOut } = params || {};

  let url = `${API}/api/public/viva-mar`;
  if (checkIn && checkOut) {
    url += `?checkIn=${checkIn}&checkOut=${checkOut}`;
  }
  try {
    const response = await fetch(url, { cache: "no-store" });
    const saasRooms = await response.json();
    return saasRooms.map((room: any) => {
      let customAmenities = [
        { label: "Wi-Fi", icon: "wifi" },
        { label: "Estacionamento", icon: "parking" },
        { label: "TV Smart", icon: "tv" },
        { label: "Frigobar", icon: "refrigerator" },
        { label: "Varanda com Rede", icon: "hammock" },
      ];

      if (room.localRoomId === "vm-standard") {
        customAmenities.push({ label: "Ventilador de Teto", icon: "fan" });
      } else {
        customAmenities.push({ label: "Ar Condicionado", icon: "snowflake" });
      }

      if (room.localRoomId === "vm-duplo-deluxe") {
        customAmenities.push({ label: "Vista Mar", icon: "waves" });
      }

      return {
        id: room.id,
        name: room.name,
        capacity: room.maxGuests,
        pricePerNight: Number(room.price),
        images: [`https://picsum.photos/seed/${room.id}/900/675`],
        amenities: customAmenities, // Suas tags
        remainingQuantity: room.remainingQuantity, // <--- ESSENCIAL PARA O MODAL SABER SE TÁ LOTADO
      };
    });
  } catch (error) {
    console.error("Erro ao buscar quartos:", error);
    return []; // Retorna lista vazia para não quebrar a tela inteira
  }
}
