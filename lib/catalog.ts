import type { Produto } from "./types";
import { consultationProducts, matchConsultationProduct, normalizeCatalogText, type ConsultationProduct } from "./consultation-products";

export type CatalogProduct = Produto | ConsultationProduct;
export const isConsultation = (product: CatalogProduct): product is ConsultationProduct => "slug" in product;

export function buildCatalog(products: Produto[]): CatalogProduct[] {
  const destacados = new Set<number>();
  const referencias = consultationProducts.flatMap<CatalogProduct>((label) => {
    const registered = products.find((product) => matchConsultationProduct(product.nome)?.slug === label.slug);
    if (registered) {
      destacados.add(registered.id);
      return registered.ativo ? [registered] : [];
    }
    return [label];
  });
  return [...referencias, ...products.filter((product) => product.ativo && !destacados.has(product.id))];
}

export function filterCatalog(products: CatalogProduct[], category: string, search: string, order: string) {
  const query = normalizeCatalogText(search);
  return products.filter((product) => {
    const label = isConsultation(product) ? product : matchConsultationProduct(product.nome);
    const description = isConsultation(product) ? `${product.dose} ${product.apresentacao}` : product.descricao;
    const matchesCategory = category === "Todos" || normalizeCatalogText(product.categoria) === normalizeCatalogText(category);
    return matchesCategory && normalizeCatalogText(`${product.nome} ${description} ${product.categoria} ${label?.dose ?? ""} ${label?.apresentacao ?? ""}`).includes(query);
  }).sort((a, b) => {
    if (order === "nome") return a.nome.localeCompare(b.nome, "pt-BR");
    if (order !== "menor" && order !== "maior") return 0;
    const priceA = isConsultation(a) ? a.precoDemonstrativo : Number(a.preco);
    const priceB = isConsultation(b) ? b.precoDemonstrativo : Number(b.preco);
    return order === "menor" ? priceA - priceB : priceB - priceA;
  });
}
