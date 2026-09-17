import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  async headers() {
    const politica = [
      "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'",
      "script-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.mercadopago.com https://viacep.com.br https://www.melhorenvio.com.br https://sandbox.melhorenvio.com.br",
      "frame-src https://www.mercadopago.com https://*.mercadopago.com",
      "form-action 'self' https://*.mercadopago.com", "upgrade-insecure-requests",
    ].join("; ");
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: politica },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        { key: "Strict-Transport-Security", value: "max-age=31536000" },
        { key: "Cross-Origin-Resource-Policy", value: "same-site" },
      ],
    }, {
      source: "/api/:path*",
      headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
    }, ...["/admin/:path*", "/minha-conta/:path*", "/privacidade"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
    }))];
  },
};

export default nextConfig;
