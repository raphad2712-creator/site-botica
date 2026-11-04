/** Dados transcritos dos oito rótulos enviados pela loja.
 * Preços iniciais incluídos a pedido da loja. O cadastro para compra é
 * resolvido no servidor antes de adicionar ao carrinho.
 */
export type ConsultationProduct = {
  slug: string;
  nome: string;
  dose: string;
  categoria: "Naturais" | "Academia" | "Florais" | "Vitaminas";
  apresentacao: string;
  precoDemonstrativo: number;
  descricao: string;
};

export const consultationProducts: ConsultationProduct[] = [
  { slug: "passiflora-300mg", nome: "Passiflora", dose: "300 mg", categoria: "Naturais", apresentacao: "60 cápsulas", precoDemonstrativo: 55.90, descricao: "Passiflora em cápsulas, com concentração de 300 mg indicada no rótulo e apresentação com 60 unidades." },
  { slug: "isoflavona-100mg", nome: "Isoflavona", dose: "100 mg", categoria: "Naturais", apresentacao: "60 cápsulas", precoDemonstrativo: 79.90, descricao: "Isoflavona em cápsulas, com concentração de 100 mg indicada no rótulo e apresentação com 60 unidades." },
  { slug: "turkesterone-500mg", nome: "Turkesterone", dose: "500 mg", categoria: "Naturais", apresentacao: "60 cápsulas", precoDemonstrativo: 85.90, descricao: "Turkesterone em cápsulas, com concentração de 500 mg indicada no rótulo e apresentação com 60 unidades." },
  { slug: "saw-palmetto-320mg", nome: "Saw Palmetto", dose: "320 mg", categoria: "Naturais", apresentacao: "60 cápsulas", precoDemonstrativo: 59.90, descricao: "Saw Palmetto em cápsulas, com concentração de 320 mg indicada no rótulo e apresentação com 60 unidades." },
  { slug: "berberina-500mg", nome: "Berberina", dose: "500 mg", categoria: "Naturais", apresentacao: "60 cápsulas", precoDemonstrativo: 95.00, descricao: "Berberina em cápsulas, com concentração de 500 mg indicada no rótulo e apresentação com 60 unidades." },
  { slug: "glucomanan-500mg", nome: "Glucomanan", dose: "500 mg", categoria: "Naturais", apresentacao: "60 cápsulas", precoDemonstrativo: 49.90, descricao: "Glucomanan em cápsulas, com concentração de 500 mg indicada no rótulo e apresentação com 60 unidades." },
  { slug: "tribulus-terrestris-500mg", nome: "Tribulus Terrestris", dose: "500 mg", categoria: "Naturais", apresentacao: "60 cápsulas", precoDemonstrativo: 59.90, descricao: "Tribulus Terrestris em cápsulas, com concentração de 500 mg indicada no rótulo e apresentação com 60 unidades." },
  { slug: "maca-peruana-500mg", nome: "Maca Peruana", dose: "500 mg", categoria: "Naturais", apresentacao: "60 cápsulas", precoDemonstrativo: 39.90, descricao: "Maca Peruana em cápsulas, com concentração de 500 mg indicada no rótulo e apresentação com 60 unidades." },
  { slug: "creatina-300g", nome: "Creatina Monohidratada", dose: "300 g", categoria: "Academia", apresentacao: "Pote de 300 g", precoDemonstrativo: 99.90, descricao: "Creatina monohidratada em pó. Embalagem de 300 g." },
  { slug: "blend-magnesio-60caps", nome: "Blend de Magnésio", dose: "", categoria: "Naturais", apresentacao: "60 cápsulas · 30 doses", precoDemonstrativo: 89.90, descricao: "Por dose: magnésio quelado 50 mg, magnésio dimalato 100 mg, magnésio treonato 200 mg, magnésio citrato 100 mg e magnésio taurato 50 mg. Confirmar se os valores representam os compostos ou o magnésio elementar." },
  { slug: "floral-rescue-30ml", nome: "Floral Rescue Ansiedade", dose: "30 ml", categoria: "Florais", apresentacao: "Frasco de 30 ml", precoDemonstrativo: 39.90, descricao: "Floral Rescue, apresentação de 30 ml. Composição e instruções de uso devem ser confirmadas com a farmácia." },
  { slug: "testo-plus-30caps", nome: "Testo+", dose: "", categoria: "Academia", apresentacao: "30 cápsulas", precoDemonstrativo: 99.90, descricao: "Fórmula informada pela loja: tribulus terrestris 300 mg, ginseng 50 mg, catuaba 100 mg, maca peruana 60 mg, feno-grego 50 mg, mucuna pruriens 50 mg, ashwagandha 30 mg, zinco quelado 5 mg e turkesterone q.s. Confirmar composição final com o farmacêutico responsável." },
  { slug: "vit-b12-metilcobalamina", nome: "Vit B12", dose: "", categoria: "Vitaminas", apresentacao: "30 cápsulas", precoDemonstrativo: 29.90, descricao: "Vitamina B12 (metilcobalamina). Apresentação de 30 cápsulas. Dosagem por cápsula não informada." },
  { slug: "vit-d-1000ui", nome: "Vit D", dose: "1000 UI", categoria: "Vitaminas", apresentacao: "30 cápsulas", precoDemonstrativo: 29.00, descricao: "Vitamina D 1000 UI. Apresentação de 30 cápsulas." },
];

export function normalizeCatalogText(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function productKey(name: string) {
  return normalizeCatalogText(name)
    .replace(/\bbotica(?:\s+bioenergetica)?\b/g, "")
    .replace(/\b(?:30|60)\s*(?:capsulas|caps)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Exige a mesma fórmula e concentração. Não troca fotos de misturas,
// de outra dosagem ou de uma quantidade diferente de cápsulas.
export function matchConsultationProduct(name: string) {
  const key = productKey(name);
  return consultationProducts.find((product) => productKey(`${product.nome} ${product.dose}`) === key);
}

export const consultationImage = (product: ConsultationProduct) => product.slug in newProductSlugs ? `/produtos/novos/${product.slug}.svg` : `/produtos/linha-natural/${product.slug}.jpg`;
const newProductSlugs: Record<string, true> = { "creatina-300g": true, "blend-magnesio-60caps": true, "floral-rescue-30ml": true, "testo-plus-30caps": true, "vit-b12-metilcobalamina": true, "vit-d-1000ui": true };
export const consultationDarkImage = (product: ConsultationProduct) => product.slug in newProductSlugs ? `/produtos/novos/${product.slug}.svg` : `/produtos/linha-natural-dark/${product.slug}.jpg`;
export const consultationArtwork = (product: ConsultationProduct) => product.slug in newProductSlugs ? `/produtos/novos/${product.slug}.svg` : `/produtos/artes/${product.slug}.jpg`;
export const consultationDarkArtwork = (product: ConsultationProduct) => product.slug in newProductSlugs ? `/produtos/novos/${product.slug}.svg` : `/produtos/artes-dark/${product.slug}.jpg`;
export const formatPrice = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function consultationHref(product: ConsultationProduct) {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "contato@boticabioenergetica.com.br";
  const name = `${product.nome} ${product.dose} — ${product.apresentacao}`;
  return `mailto:${email}?subject=${encodeURIComponent(`Consulta sobre ${name}`)}&body=${encodeURIComponent(`Olá! Gostaria de consultar o preço e a disponibilidade de ${name}.`)}`;
}
