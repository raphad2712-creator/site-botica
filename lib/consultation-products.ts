/** Dados transcritos dos oito rótulos enviados pela loja.
 * Preços iniciais incluídos a pedido da loja. O cadastro para compra é
 * resolvido no servidor antes de adicionar ao carrinho.
 */
export type ConsultationProduct = {
  slug: string;
  nome: string;
  dose: string;
  categoria: "Naturais";
  apresentacao: "60 cápsulas";
  precoDemonstrativo: number;
};

export const consultationProducts: ConsultationProduct[] = [
  { slug: "passiflora-300mg", nome: "Passiflora", dose: "300 mg", categoria: "Naturais", apresentacao: "60 cápsulas", precoDemonstrativo: 39.90 },
  { slug: "isoflavona-100mg", nome: "Isoflavona", dose: "100 mg", categoria: "Naturais", apresentacao: "60 cápsulas", precoDemonstrativo: 59.90 },
  { slug: "turkesterone-500mg", nome: "Turkesterone", dose: "500 mg", categoria: "Naturais", apresentacao: "60 cápsulas", precoDemonstrativo: 129.90 },
  { slug: "saw-palmetto-320mg", nome: "Saw Palmetto", dose: "320 mg", categoria: "Naturais", apresentacao: "60 cápsulas", precoDemonstrativo: 69.90 },
  { slug: "berberina-500mg", nome: "Berberina", dose: "500 mg", categoria: "Naturais", apresentacao: "60 cápsulas", precoDemonstrativo: 79.90 },
  { slug: "glucomanan-500mg", nome: "Glucomanan", dose: "500 mg", categoria: "Naturais", apresentacao: "60 cápsulas", precoDemonstrativo: 49.90 },
  { slug: "tribulus-terrestris-500mg", nome: "Tribulus Terrestris", dose: "500 mg", categoria: "Naturais", apresentacao: "60 cápsulas", precoDemonstrativo: 59.90 },
  { slug: "maca-peruana-500mg", nome: "Maca Peruana", dose: "500 mg", categoria: "Naturais", apresentacao: "60 cápsulas", precoDemonstrativo: 39.90 },
];

export function normalizeCatalogText(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function productKey(name: string) {
  return normalizeCatalogText(name)
    .replace(/\bbotica(?:\s+bioenergetica)?\b/g, "")
    .replace(/\b60\s*(?:capsulas|caps)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Exige a mesma fórmula e concentração. Não troca fotos de misturas,
// de outra dosagem ou de uma quantidade diferente de cápsulas.
export function matchConsultationProduct(name: string) {
  const key = productKey(name);
  return consultationProducts.find((product) => productKey(`${product.nome} ${product.dose}`) === key);
}

export const consultationImage = (product: ConsultationProduct) => `/produtos/linha-natural/${product.slug}.jpg`;
export const consultationDarkImage = (product: ConsultationProduct) => `/produtos/linha-natural-dark/${product.slug}.jpg`;
export const consultationArtwork = (product: ConsultationProduct) => `/produtos/artes/${product.slug}.jpg`;
export const formatPrice = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function consultationHref(product: ConsultationProduct) {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "raphad2712@gmail.com";
  const name = `${product.nome} ${product.dose} — ${product.apresentacao}`;
  return `mailto:${email}?subject=${encodeURIComponent(`Consulta sobre ${name}`)}&body=${encodeURIComponent(`Olá! Gostaria de consultar o preço e a disponibilidade de ${name}.`)}`;
}
