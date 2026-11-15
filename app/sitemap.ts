import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const origem = process.env.NEXT_PUBLIC_SITE_URL || "https://site-botica.vercel.app";
  return ["/", "/politica-de-privacidade", "/politica-de-trocas-e-devolucoes", "/termos-de-uso"].map((path) => ({ url: new URL(path, origem).href }));
}
