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
  // Mínimo de estadia. Quando a busca informa checkIn/checkOut, já vem
  // ajustado pra tarifa sazonal do período (pode exigir mais noites que o
  // padrão do quarto, ex.: Réveillon).
  minStayNights: number | null;
  minStayDays: number | null;
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
  minStayNights: number | null; // mínimo de noites exigido (null = sem mínimo)
  minStayDays: number | null; // mínimo de dias corridos exigido (null = sem mínimo)
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
  cep?: string;
  address?: string;
  addressNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
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

// --- CHECKOUT (Mercado Pago Payment Brick) ---
// Dados da reserva que só existem no front (nome do quarto, datas em
// contexto) somados ao BookingFormData. Vai dentro do metadata do pagamento
// e é reaproveitado pelo webhook pra criar a reserva de verdade no SaaS
// depois que o Mercado Pago confirma o pagamento.
export interface CheckoutSessionRequest extends BookingFormData {
  roomName: string;
}

// Enviado para POST /api/checkout/process-payment: os dados que o Payment
// Brick devolveu no onSubmit (token do cartão, método escolhido, etc.) mais
// a reserva que esse pagamento se refere.
export interface ProcessPaymentRequest {
  formData: Record<string, unknown>;
  booking: CheckoutSessionRequest;
  // Fingerprint do dispositivo coletado pelo SDK do Mercado Pago no
  // navegador (window.MP_DEVICE_SESSION_ID) — ajuda a análise de risco do
  // Mercado Pago e evita que ela fique restritiva por falta de sinal.
  deviceId?: string;
}

export interface ProcessPaymentResponse {
  status: string;
  statusDetail: string;
  paymentId: number;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
}

// Enviado para POST /api/checkout/create-preference: cria uma preferência do
// Mercado Pago só pra habilitar a opção de carteira "Mercado Pago" dentro do
// Payment Brick (o SDK exige um preferenceId pra isso) — cartão e Pix
// continuam indo direto por /api/checkout/process-payment, sem depender
// dessa preferência.
export interface CreatePreferenceRequest {
  booking: CheckoutSessionRequest;
}

export interface CreatePreferenceResponse {
  preferenceId: string;
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
