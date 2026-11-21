import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const origem = process.env.NEXT_PUBLIC_SITE_URL || "https://www.boticabioenergetica.com.br";
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/auth/", "/login", "/redefinir-senha", "/minha-conta", "/carrinho", "/checkout", "/pagamento/", "/privacidade"] }, sitemap: `${origem}/sitemap.xml` };
}
