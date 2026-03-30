import type { DiscountCoupon } from '@/types';

// Cupons válidos — em produção, validar server-side via /api/coupons/validate
export const VALID_COUPONS: DiscountCoupon[] = [
  {
    code: 'VIVAMAR10',
    type: 'percentage',
    value: 10,
    description: '10% de desconto na sua reserva',
  },
  {
    code: 'PRAIA50',
    type: 'fixed',
    value: 50,
    minNights: 2,
    description: 'R$ 50 de desconto (mín. 2 noites)',
  },
  {
    code: 'FERIAS20',
    type: 'percentage',
    value: 20,
    minNights: 3,
    description: '20% de desconto em estadias de 3+ noites',
  },
];

export function validateCoupon(
  code: string,
  nights: number,
  subtotal: number
): { valid: boolean; coupon?: DiscountCoupon; discountAmount: number; message: string } {
  const coupon = VALID_COUPONS.find(
    (c) => c.code.toUpperCase() === code.toUpperCase()
  );

  if (!coupon) {
    return { valid: false, discountAmount: 0, message: 'Cupom inválido ou não encontrado.' };
  }

  if (coupon.minNights && nights < coupon.minNights) {
    return {
      valid: false,
      discountAmount: 0,
      message: `Este cupom requer mínimo de ${coupon.minNights} noites.`,
    };
  }

  if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
    return { valid: false, discountAmount: 0, message: 'Cupom expirado.' };
  }

  const discountAmount =
    coupon.type === 'percentage'
      ? Math.round((subtotal * coupon.value) / 100)
      : Math.min(coupon.value, subtotal);

  return {
    valid: true,
    coupon,
    discountAmount,
    message: `${coupon.description} — desconto de R$ ${discountAmount.toFixed(2)} aplicado!`,
  };
}
