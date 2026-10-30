import { beforeEach, expect, it, vi } from 'vitest';
import { validateBookingPayload } from '@/lib/validators';
import { guestRequest } from '@/lib/api/guest';
import { resetRateLimitStore } from '@/lib/rate-limit';
const mocks = vi.hoisted(() => ({ payment: vi.fn(), price: vi.fn(), getPayment: vi.fn() }));
vi.mock('@/lib/mercadopago', () => ({ createPayment: mocks.payment, getPayment: mocks.getPayment }));
vi.mock('@/lib/pricing', () => ({ computeAuthoritativePrice: mocks.price, PricingError: class extends Error {} }));
import { POST as processPayment } from '@/app/api/checkout/process-payment/route';
import { POST as webhook } from '@/app/api/webhooks/mercadopago/route';
import { createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';
const booking = { roomId: 'suite', roomName: 'Suíte', checkIn: '2099-01-01', checkOut: '2099-01-03', nights: 2, guests: 2, total: 200, packages: [{ id: '7', name: 'Café', quantity: 1, price: 10 }], guest: { firstName: 'Ana', lastName: 'Silva', email: 'ana@example.com', phone: '22999999999', cpf: '52998224725' } };
beforeEach(() => { vi.clearAllMocks(); resetRateLimitStore(); mocks.price.mockResolvedValue({ total: 200 }); mocks.payment.mockResolvedValue({ id: 1, status: 'approved' }); process.env.NEXT_PUBLIC_API_URL = 'https://admin.test'; process.env.MERCADOPAGO_WEBHOOK_SECRET = 'webhook-secret'; process.env.RESERVATION_API_SECRET = 'x'.repeat(48); vi.unstubAllGlobals(); });
it('keeps package IDs and derives nights instead of trusting the client', () => { const result = validateBookingPayload({ ...booking, nights: 100 }); expect(result.valid).toBe(true); expect(result.sanitized.packages[0].id).toBe('7'); expect(result.sanitized.nights).toBe(2); });
it.each([{ total: 'NaN' }, { total: -1 }, { checkIn: '2099-02-30' }, { packages: [{ id: '1', quantity: 1000000 }] }, { guest: { ...booking.guest, cpf: '12345678901' } }])('rejects invalid checkout before payment: %j', async patch => {
 const response = await processPayment(new Request('https://site.test/api', { method: 'POST', body: JSON.stringify({ booking: { ...booking, ...patch }, formData: {} }) })); expect(response.status).toBe(400); expect(mocks.payment).not.toHaveBeenCalled();
});
it('uses authoritative price and refuses a changed total', async () => {
 const req = () => new Request('https://site.test/api', { method: 'POST', body: JSON.stringify({ booking, formData: { token: 'card' } }) });
 expect((await processPayment(req())).status).toBe(201); expect(mocks.payment.mock.calls[0][0].transactionAmount).toBe(200);
 mocks.price.mockResolvedValue({ total: 250 }); expect((await processPayment(req())).status).toBe(409);
});
it('limits card attempts by normalized email across IPs', async () => {
 for (let i = 0; i < 6; i++) { const response = await processPayment(new Request('https://site.test/api', { method: 'POST', headers: { 'x-forwarded-for': `10.0.0.${i}` }, body: JSON.stringify({ booking, formData: {} }) })); if (i === 5) expect(response.status).toBe(429); } expect(mocks.payment).toHaveBeenCalledTimes(5);
});
function notification(id: string, ageMs = 0) { const ts = String(Date.now() - ageMs), requestId = 'request-1'; const signature = createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET!).update(`id:${id};request-id:${requestId};ts:${ts};`).digest('hex'); return new NextRequest(`https://site.test/api/webhooks/mercadopago?type=payment&data.id=${id}`, { method: 'POST', headers: { 'x-signature': `ts=${ts},v1=${signature}`, 'x-request-id': requestId }, body: '{}' }); }
it('rejects an expired but correctly signed webhook', async () => { expect((await webhook(notification('91', 11 * 60_000))).status).toBe(401); expect(mocks.getPayment).not.toHaveBeenCalled(); });
it('authenticates backend confirmation and retries transient failures', async () => {
 mocks.getPayment.mockResolvedValue({ id: 92, status: 'approved', metadata: { room_id: 'suite' } }); const fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 503 })); vi.stubGlobal('fetch', fetch);
 expect((await webhook(notification('92'))).status).toBe(503); expect(fetch.mock.calls[0][0]).toBe('https://admin.test/api/public/viva-mar'); expect(fetch.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${process.env.RESERVATION_API_SECRET}`);
 fetch.mockResolvedValue(new Response('{}', { status: 201 })); expect((await webhook(notification('92'))).status).toBe(200);
});
it('keeps guest credentials out of URLs and tokens in the authorization header', async () => {
 const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }))); vi.stubGlobal('fetch', fetch); await guestRequest('lookup', undefined, { code: 'mp_1', identifier: '52998224725' }); expect(fetch.mock.calls[0][0]).not.toContain('52998224725');
 fetch.mockResolvedValue(new Response(JSON.stringify({ ok: true }))); await guestRequest('voucher', 'guest-token', {}); expect(fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer guest-token');
});
