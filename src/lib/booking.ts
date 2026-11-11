// A reserva só é criada de fato no SaaS (Saas-Sancho) depois que o
// pagamento é aprovado no Mercado Pago — ver src/lib/api/checkout.ts
// (cria a preferência/redireciona para o Checkout Pro) e
// src/app/api/webhooks/mercadopago/route.ts (confirma a reserva via
// POST /api/public/viva-mar quando o webhook reporta pagamento aprovado).

// Calcula número de noites entre duas datas
export function calcNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

// Formata preço em BRL
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/** Código de consulta mostrado ao hóspede (o mesmo aceito no campo de busca), ex.: VIVA-1042. */
export function formatReservationCode(id: number | string): string {
  const str = String(id).trim();
  if (/^VIVA-\d+$/i.test(str)) return str.toUpperCase();
  const digits = str.match(/\d+/);
  return digits ? `VIVA-${digits[0]}` : `VIVA-${str}`;
}
