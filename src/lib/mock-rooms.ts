// ============================================================
// MOCK DATA — Quartos da Pousada Viva Mar
// ============================================================
// Para integrar dados reais, substitua este array pelo retorno
// da sua rota: GET /api/tenant/channex/room-types/route.ts
//
// Mapeamento Channex:
//   id          → room_type.id
//   propertyId  → property.id
//   name        → room_type.attributes.title
//   description → room_type.attributes.description
//   maxOccupancy→ room_type.attributes.occupancy
//   pricePerNight → rate_plan.attributes.sell_mode (calculado por data)
// ============================================================

import type { RoomType } from '@/types';

export const MOCK_ROOMS: RoomType[] = [
  {
    id: 'channex-rt-001',
    propertyId: 'channex-prop-vivamar',
    name: 'Suíte Mar Aberto',
    description:
      'Suíte de frente para o oceano com varanda privativa. Dé bom dia ao Atlântico sem sair da cama.',
    maxOccupancy: 2,
    pricePerNight: 420,
    size: '38 m²',
    bedType: 'Cama King',
    view: 'Vista Mar Frontal',
    available: true,
    images: [
      'https://picsum.photos/seed/room-ocean-suite/800/500',
      'https://picsum.photos/seed/room-ocean-bath/800/500',
    ],
    amenities: [
      { icon: 'wifi', label: 'Wi-Fi gratuito' },
      { icon: 'air-vent', label: 'Ar-condicionado' },
      { icon: 'tv', label: 'Smart TV 55"' },
      { icon: 'bath', label: 'Banheira de hidromassagem' },
      { icon: 'coffee', label: 'Café da manhã incluso' },
      { icon: 'waves', label: 'Varanda com vista mar' },
    ],
  },
  {
    id: 'channex-rt-002',
    propertyId: 'channex-prop-vivamar',
    name: 'Chalé Areia Branca',
    description:
      'Chalé autônomo com deck de madeira a 30 metros da areia. Privacidade total em meio à natureza.',
    maxOccupancy: 3,
    pricePerNight: 360,
    size: '45 m²',
    bedType: 'Cama Queen + Sofá-cama',
    view: 'Vista Jardim / Mar Lateral',
    available: true,
    images: [
      'https://picsum.photos/seed/room-chalet-beach/800/500',
      'https://picsum.photos/seed/room-chalet-deck/800/500',
    ],
    amenities: [
      { icon: 'wifi', label: 'Wi-Fi gratuito' },
      { icon: 'air-vent', label: 'Ar-condicionado' },
      { icon: 'tv', label: 'Smart TV 43"' },
      { icon: 'coffee', label: 'Café da manhã incluso' },
      { icon: 'trees', label: 'Deck privativo' },
      { icon: 'parking-circle', label: 'Estacionamento incluso' },
    ],
  },
  {
    id: 'channex-rt-003',
    propertyId: 'channex-prop-vivamar',
    name: 'Quarto Standard Lagoa',
    description:
      'Quarto aconchegante com vista para a lagoa interna. Ideal para casais que buscam conforto e custo-benefício.',
    maxOccupancy: 2,
    pricePerNight: 240,
    size: '24 m²',
    bedType: 'Cama Casal',
    view: 'Vista Lagoa',
    available: true,
    images: [
      'https://picsum.photos/seed/room-standard-lagoon/800/500',
      'https://picsum.photos/seed/room-standard-interior/800/500',
    ],
    amenities: [
      { icon: 'wifi', label: 'Wi-Fi gratuito' },
      { icon: 'air-vent', label: 'Ar-condicionado' },
      { icon: 'tv', label: 'Smart TV 40"' },
      { icon: 'coffee', label: 'Café da manhã incluso' },
    ],
  },
  {
    id: 'channex-rt-004',
    propertyId: 'channex-prop-vivamar',
    name: 'Suíte Família Coral',
    description:
      'Espaçosa suíte com dois ambientes integrados. Perfeita para famílias que não abrem mão de conforto.',
    maxOccupancy: 5,
    pricePerNight: 580,
    size: '60 m²',
    bedType: 'Cama King + 2 Camas Solteiro',
    view: 'Vista Mar Parcial',
    available: true,
    images: [
      'https://picsum.photos/seed/room-family-suite/800/500',
      'https://picsum.photos/seed/room-family-living/800/500',
    ],
    amenities: [
      { icon: 'wifi', label: 'Wi-Fi gratuito' },
      { icon: 'air-vent', label: 'Ar-condicionado' },
      { icon: 'tv', label: 'Smart TV 55"' },
      { icon: 'coffee', label: 'Café da manhã incluso' },
      { icon: 'utensils', label: 'Kitchenette' },
      { icon: 'waves', label: 'Vista mar parcial' },
    ],
  },
];

// Para buscar os quartos filtrados por disponibilidade, datas e hóspedes:
// Substitua por: fetch('/api/tenant/channex/room-types?checkIn=...&checkOut=...&guests=...')
export async function fetchRooms(_params?: {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}): Promise<RoomType[]> {
  // TODO: Substitua por chamada real à API Channex via rota interna:
  // const res = await fetch(`/api/tenant/channex/room-types?${new URLSearchParams(_params)}`);
  // const data = await res.json();
  // return data.room_types.map(mapChannexToRoomType);

  // Mock: simula delay de rede
  await new Promise((r) => setTimeout(r, 600));
  return MOCK_ROOMS.filter((r) => r.available);
}
