import type { Produto } from "./types";
import { consultationProducts, matchConsultationProduct, normalizeCatalogText, type ConsultationProduct } from "./consultation-products";

export type CatalogProduct = Produto | ConsultationProduct;
export const isConsultation = (product: CatalogProduct): product is ConsultationProduct => "slug" in product;

export function buildCatalog(products: Produto[]): CatalogProduct[] {
  const featured = consultationProducts.flatMap<CatalogProduct>((label) => {
    const registered = products.find((product) => matchConsultationProduct(product.nome)?.slug === label.slug);
    return registered ? (registered.ativo ? [registered] : []) : [label];
  });
  return [...featured, ...products.filter((product) => product.ativo && !matchConsultationProduct(product.nome))];
}

export function filterCatalog(products: CatalogProduct[], category: string, search: string, order: string) {
  const query = normalizeCatalogText(search);
  return products.filter((product) => {
    const label = isConsultation(product) ? product : matchConsultationProduct(product.nome);
    const description = isConsultation(product) ? `${product.dose} ${product.apresentacao}` : product.descricao;
    const matchesCategory = category === "Todos" || normalizeCatalogText(product.categoria) === normalizeCatalogText(category) || (category === "Naturais" && !!label);
    return matchesCategory && normalizeCatalogText(`${product.nome} ${description} ${product.categoria} ${label?.dose ?? ""} ${label?.apresentacao ?? ""}`).includes(query);
  }).sort((a, b) => {
    if (order === "nome") return a.nome.localeCompare(b.nome, "pt-BR");
    if (order !== "menor" && order !== "maior") return 0;
    // Um preço não informado nunca é tratado como zero.
    if (isConsultation(a)) return isConsultation(b) ? 0 : 1;
    if (isConsultation(b)) return -1;
    return order === "menor" ? Number(a.preco) - Number(b.preco) : Number(b.preco) - Number(a.preco);
  });
}
