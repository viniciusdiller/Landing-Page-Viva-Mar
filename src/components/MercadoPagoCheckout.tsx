'use client';

import { useEffect } from 'react';
import { CreditCard, QrCode, ShieldCheck } from 'lucide-react';
import { Wallet, initMercadoPago } from '@mercadopago/sdk-react';

interface MercadoPagoCheckoutProps {
  preferenceId?: string;
  publicKey?: string;
  onStatusHint?: (status: 'pending' | 'ready') => void;
}

export default function MercadoPagoCheckout({
  preferenceId,
  publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY,
  onStatusHint,
}: MercadoPagoCheckoutProps) {
  useEffect(() => {
    if (publicKey) {
      initMercadoPago(publicKey, { locale: 'pt-BR' });
      onStatusHint?.('ready');
    } else {
      onStatusHint?.('pending');
    }
  }, [publicKey, onStatusHint]);

  return (
    <section className="rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-surface-2)]">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h4 className="mb-1" style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>
            Pagamento com Mercado Pago
          </h4>
          <p className="text-[var(--color-text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
            Pronto para PIX e cartão com confirmação assíncrona por webhook.
          </p>
        </div>
        <ShieldCheck className="text-[var(--color-primary)]" size={18} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
          <QrCode size={12} /> PIX
        </span>
        <span className="badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
          <CreditCard size={12} /> Cartão
        </span>
      </div>

      {/*
        Integração real:
        1) Backend cria a preferência em /api/payments/create-preference.
        2) Retorna preferenceId para este componente.
        3) Wallet/Brick renderiza o fluxo de pagamento.
        4) /api/webhooks/mercadopago confirma status e atualiza a reserva no SaaS.
      */}
      {publicKey && preferenceId ? (
        <Wallet initialization={{ preferenceId }} />
      ) : (
        <button type="button" className="btn btn-primary w-full" disabled>
          Pagar via PIX/Cartão Mercado Pago (modo estrutural)
        </button>
      )}
    </section>
  );
}
