import type { Produto } from "@/lib/types";

export const PRODUCT_LOGO_LIGHT = "/botica-logo-transparente.png";
export const PRODUCT_LOGO_DARK = "/botica-logo-dark-transparent.png";

export function imagemCatalogo(_nome: string, _imagemAtual?: string | null) {
  return PRODUCT_LOGO_LIGHT;
}

export function imagemCatalogoEscura(_nome: string) {
  return PRODUCT_LOGO_DARK;
}

export function comImagemCatalogo(produto: Produto): Produto {
  return { ...produto, imagem_url: imagemCatalogo(produto.nome, produto.imagem_url) };
}
