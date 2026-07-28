// ============================================================
// TIPOS CENTRAIS — Pousada Viva Mar / SaaS de Gestão Hoteleira
// ============================================================
// Estes tipos espelham a estrutura de dados da Channex API e
// da API interna do SaaS. Ao integrar dados reais, substitua
// os mocks pelo retorno de /api/tenant/channex/room-types/route.ts
// ============================================================

// --- QUARTO (mapeado para Channex RoomType) ---
export interface RoomAmenity {
  icon: string; // nome do ícone Lucide
  label: string;
}

export type RoomStatus = "active" | "maintenance";

export interface PublicRoomApiItem {
  id: string;
  channexRoomTypeId: string;
  name: string;
  maxGuests: number;
  status: RoomStatus;
  price: number;
  quantity: number;
  amenities: string | null;
  amenitiesList: string[];
  photoUrls: string[];
  remainingQuantity: number;
}

export interface FetchPublicRoomsParams {
  checkIn?: string;
  checkOut?: string;
}

// --- GALERIA DE FOTOS DA POUSADA ---
export interface PublicGalleryPhotoApiItem {
  id: number;
  url: string;
  caption: string | null;
  sortOrder: number;
}

export interface GalleryPhoto {
  id: number;
  url: string;
  caption: string | null;
}

export interface RoomType {
  // ID usado na API Channex: property_id + room_type_id
  id: string; // channex room_type_id
  propertyId?: string; // channex property_id
  channexRoomTypeId?: string;
  name: string;
  description: string;
  maxOccupancy: number;
  pricePerNight: number; // em BRL (centavos ÷ 100)
  priceOnRequest?: boolean; // quando o valor deve ser exibido como "A consultar"
  images: string[]; // URLs das fotos do quarto
  photoUrls: string[];
  status?: RoomStatus;
  quantity?: number;
  remainingQuantity?: number;
  amenities: RoomAmenity[];
  amenitiesList: string[];
  available: boolean;
  availableUnits?: number; // quantidade de unidades disponíveis
  capacity: number; // número de hóspedes que o quarto acomoda
  // Campos extras para UI
  size?: string; // ex: "28 m²"
  bedType?: string; // ex: "Cama King"
  view?: string; // ex: "Vista Mar"
}

// --- HÓSPEDE ---
export interface GuestData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cpf?: string;
  specialRequests?: string;
}

// --- RESERVA (pré criação) ---
export interface BookingFormData {
  roomId: string;
  propertyId?: string;
  checkIn: string; // ISO date string YYYY-MM-DD
  checkOut: string; // ISO date string YYYY-MM-DD
  guests: number;
  nights: number;
  pricePerNight: number;
  subtotal: number;
  discountCode?: string;
  discountAmount: number; // valor em BRL deduzido
  packages: SelectedPackage[]; // pacotes/adicionais selecionados
  packagesTotal: number; // valor total dos pacotes
  total: number;
  guest: GuestData;
}

// --- STATUS DO PAGAMENTO ---
export type PaymentStatus =
  | "pending"
  | "approved"
  | "in_process"
  | "rejected"
  | "cancelled"
  | "refunded";

// --- PAYLOAD ENVIADO PARA A API INTERNA ANTES/APÓS MERCADO PAGO ---
// Enviado para POST /api/bookings/create
export interface CreateBookingPayload {
  // Dados do quarto / propriedade
  roomId: string;
  propertyId?: string;

  // Período
  checkIn: string;
  checkOut: string;
  nights: number;

  // Hóspedes
  guestCount: number;
  guest: GuestData;

  // Valores
  pricePerNight: number;
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  packages: SelectedPackage[]; // pacotes/adicionais selecionados
  packagesTotal: number; // valor total dos pacotes
  total: number; // valor final cobrado em BRL

  // Pagamento
  paymentStatus: PaymentStatus;
  // O externalPaymentId é preenchido após confirmação do Mercado Pago
  externalPaymentId?: string; // preference_id ou payment_id do MP
  paymentMethod?: "pix" | "credit_card" | "debit_card";

  // Metadados
  source: "landing_page" | "admin" | "channel_manager";
  createdAt: string; // ISO timestamp
}

// --- RESPOSTA DA API INTERNA ---
export interface BookingResponse {
  success: boolean;
  bookingId: string; // ID interno do SaaS
  channexBookingId?: string; // ID no Channex (após sync)
  status: "confirmed" | "pending_payment" | "failed";
  message: string;
}

// --- WEBHOOK MERCADO PAGO ---
// Recebido em POST /api/webhooks/mercadopago
export interface MercadoPagoWebhookPayload {
  id: number;
  live_mode: boolean;
  type:
    | "payment"
    | "plan"
    | "subscription"
    | "invoice"
    | "point_integration_wh";
  date_created: string;
  user_id: number;
  api_version: string;
  action: "payment.created" | "payment.updated";
  data: {
    id: string; // payment_id do Mercado Pago
  };
}

// --- PACOTES / ADICIONAIS ---
export interface Package {
  id: string;
  name: string;
  description: string;
  price: number; // em BRL
  icon?: string; // nome do ícone Lucide
}

export interface PublicAddonApiItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
}

// --- COUPON / DESCONTO ---
export interface DiscountCoupon {
  code: string;
  type: "percentage" | "fixed";
  value: number; // % ou BRL
  minNights?: number;
  validUntil?: string;
  description: string;
}

// --- PACOTES SELECIONADOS NA RESERVA ---
export interface SelectedPackage extends Package {
  quantity: number; // quantidade do pacote
}

// --- BUSCA DE QUARTOS (SearchWidget) ---
export interface RoomSearchParams {
  destination?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}
