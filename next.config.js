// Origem da API do Saas-Sancho é dinâmica por ambiente (dev usa localhost,
// produção usa o domínio/IP real do cliente) — incluída explicitamente na
// CSP pra imagens dos quartos e chamadas fetch funcionarem sem precisar
// liberar https: genérico.
const apiOrigin = (
  process.env.NEXT_PUBLIC_VIVAMAR_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  ""
).replace(/\/$/, "");

// O webpack dev server do Next (next dev) usa eval() pra montar os source
// maps/Fast Refresh — sem 'unsafe-eval' em dev, o CSP bloqueia o bundle
// inteiro de rodar (a página fica com a casca estática só, nada de JS
// client-side executa: nenhum fetch dispara, tudo parece "carregando pra
// sempre"). Em produção (next build) isso não é necessário — mantém a CSP
// mais restrita lá.
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' é necessário pro Payment Brick do Mercado Pago (injeta
  // estilos/scripts inline) — não há como restringir mais sem quebrar o
  // checkout. Reavalie se o SDK deles passar a suportar nonces.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.mercadopago.com https://sdk.mercadopago.com https://secure.mlstatic.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com`,
  // data: cobre o QR code do Pix (vem em base64); o restante são domínios
  // conhecidos de onde as fotos podem vir.
  `img-src 'self' data: blob: https: ${apiOrigin}`.trim(),
  `connect-src 'self' https://api.mercadopago.com https://viacep.com.br ${apiOrigin}`.trim(),
  `frame-src 'self' https://www.mercadopago.com https://www.google.com`,
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]
  .filter(Boolean)
  .join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
