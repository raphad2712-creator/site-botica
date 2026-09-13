/** Dados transcritos dos oito rótulos enviados pela loja.
 * Preço, estoque, composição completa e posologia não foram informados.
 * Estes itens não recebem IDs fictícios e não podem entrar no checkout.
 */
export type ConsultationProduct = {
  slug: string;
  nome: string;
  dose: string;
  categoria: "Naturais";
  apresentacao: "60 cápsulas";
};

export const consultationProducts: ConsultationProduct[] = [
  { slug: "passiflora-300mg", nome: "Passiflora", dose: "300 mg", categoria: "Naturais", apresentacao: "60 cápsulas" },
  { slug: "isoflavona-100mg", nome: "Isoflavona", dose: "100 mg", categoria: "Naturais", apresentacao: "60 cápsulas" },
  { slug: "turkesterone-500mg", nome: "Turkesterone", dose: "500 mg", categoria: "Naturais", apresentacao: "60 cápsulas" },
  { slug: "saw-palmetto-320mg", nome: "Saw Palmetto", dose: "320 mg", categoria: "Naturais", apresentacao: "60 cápsulas" },
  { slug: "berberina-500mg", nome: "Berberina", dose: "500 mg", categoria: "Naturais", apresentacao: "60 cápsulas" },
  { slug: "glucomanan-500mg", nome: "Glucomanan", dose: "500 mg", categoria: "Naturais", apresentacao: "60 cápsulas" },
  { slug: "tribulus-terrestris-500mg", nome: "Tribulus Terrestris", dose: "500 mg", categoria: "Naturais", apresentacao: "60 cápsulas" },
  { slug: "maca-peruana-500mg", nome: "Maca Peruana", dose: "500 mg", categoria: "Naturais", apresentacao: "60 cápsulas" },
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

export function consultationHref(product: ConsultationProduct) {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "raphad2712@gmail.com";
  const name = `${product.nome} ${product.dose} — ${product.apresentacao}`;
  return `mailto:${email}?subject=${encodeURIComponent(`Consulta sobre ${name}`)}&body=${encodeURIComponent(`Olá! Gostaria de consultar o preço e a disponibilidade de ${name}.`)}`;
}
