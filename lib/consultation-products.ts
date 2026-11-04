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
  subtitulo?: string;
  composicao?: Array<{ ingrediente: string; quantidade: string }>;
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
  { slug: "blend-magnesio-60caps", nome: "Blend de Magnésio", dose: "", categoria: "Naturais", apresentacao: "60 cápsulas · 30 doses", precoDemonstrativo: 89.90, descricao: "Blend com cinco fontes de magnésio. Apresentação com 60 cápsulas, correspondente a 30 doses." },
  { slug: "floral-rescue-30ml", nome: "Floral Rescue Ansiedade", dose: "30 ml", categoria: "Florais", apresentacao: "Frasco de 30 ml", precoDemonstrativo: 39.90, descricao: "Floral Rescue, apresentação de 30 ml. Composição e instruções de uso devem ser confirmadas com a farmácia." },
  { slug: "testo-plus-30caps", nome: "Testo+", dose: "", categoria: "Academia", apresentacao: "30 cápsulas", precoDemonstrativo: 99.90, descricao: "Fórmula informada pela loja: tribulus terrestris 300 mg, ginseng 50 mg, catuaba 100 mg, maca peruana 60 mg, feno-grego 50 mg, mucuna pruriens 50 mg, ashwagandha 30 mg, zinco quelado 5 mg e turkesterone q.s. " },
  { slug: "vit-b12-metilcobalamina", nome: "Vit B12", subtitulo: "Metilcobalamina", dose: "", categoria: "Vitaminas", apresentacao: "30 cápsulas", precoDemonstrativo: 29.90, descricao: "Vitamina B12 (metilcobalamina). Apresentação de 30 cápsulas. " },
  { slug: "vit-d-1000ui", nome: "Vit D", dose: "1000 UI", categoria: "Vitaminas", apresentacao: "30 cápsulas", precoDemonstrativo: 29.00, descricao: "Vitamina D 1000 UI. Apresentação de 30 cápsulas." },
];

const formulas: Record<string, NonNullable<ConsultationProduct["composicao"]>> = {
  "blend-magnesio-60caps": [
    { ingrediente: "Magnésio quelado", quantidade: "50 mg" },
    { ingrediente: "Magnésio dimalato", quantidade: "100 mg" },
    { ingrediente: "Magnésio treonato", quantidade: "200 mg" },
    { ingrediente: "Magnésio citrato", quantidade: "100 mg" },
    { ingrediente: "Magnésio taurato", quantidade: "50 mg" },
  ],
  "testo-plus-30caps": [
    { ingrediente: "Tribulus terrestris", quantidade: "300 mg" },
    { ingrediente: "Ginseng", quantidade: "50 mg" },
    { ingrediente: "Catuaba", quantidade: "100 mg" },
    { ingrediente: "Maca peruana", quantidade: "60 mg" },
    { ingrediente: "Feno-grego", quantidade: "50 mg" },
    { ingrediente: "Mucuna pruriens", quantidade: "50 mg" },
    { ingrediente: "Ashwagandha", quantidade: "30 mg" },
    { ingrediente: "Zinco quelado", quantidade: "5 mg" },
    { ingrediente: "Turkesterone", quantidade: "q.s." },
  ],
};
for (const product of consultationProducts) product.composicao = formulas[product.slug];

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

export const consultationImage = (product: ConsultationProduct) => `/produtos/padrao/${product.slug}.webp`;
export const consultationDarkImage = (product: ConsultationProduct) => consultationImage(product);
export const consultationArtwork = (product: ConsultationProduct) => consultationImage(product);
export const consultationDarkArtwork = (product: ConsultationProduct) => consultationImage(product);
export const formatPrice = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function consultationHref(product: ConsultationProduct) {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "contato@boticabioenergetica.com.br";
  const name = `${product.nome} ${product.dose} — ${product.apresentacao}`;
  return `mailto:${email}?subject=${encodeURIComponent(`Consulta sobre ${name}`)}&body=${encodeURIComponent(`Olá! Gostaria de consultar o preço e a disponibilidade de ${name}.`)}`;
}

// Lista comercial enviada pela loja; os três itens marcados como OK mantêm o cadastro.
const precosAtualizados = new Set([
  "passiflora-300mg", "isoflavona-100mg", "turkesterone-500mg", "saw-palmetto-320mg",
  "berberina-500mg", "creatina-300g", "blend-magnesio-60caps", "floral-rescue-30ml",
  "testo-plus-30caps", "vit-b12-metilcobalamina", "vit-d-1000ui",
]);

export function aplicarPrecoCatalogo<T extends { nome: string; preco: number | string; preco_antigo?: number | string | null }>(produto: T): T {
  const rotulo = matchConsultationProduct(produto.nome);
  if (!rotulo || !precosAtualizados.has(rotulo.slug)) return produto;
  return { ...produto, preco: rotulo.precoDemonstrativo, preco_antigo: null };
}
