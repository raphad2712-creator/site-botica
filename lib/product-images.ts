import type { Produto } from "@/lib/types";
import { consultationImage, matchConsultationProduct, aplicarPrecoCatalogo } from "./consultation-products";

const imagensCatalogo: Array<[RegExp, string]> = [
  [/creatina monohidratada/, "/produtos/novos/creatina-300g.svg"],
  [/melatonina.*gotas/, "/produtos/melatonina-gotas-20ml.jpg"],
  [/floral rescue/, "/produtos/novos/floral-rescue-30ml.svg"],
  [/vit(?:amina)? b12|metilcobalamina/, "/produtos/novos/vit-b12-metilcobalamina.svg"],
  [/vit(?:amina)? d(?:3)? 1000/, "/produtos/novos/vit-d-1000ui.svg"],
  [/psyllium/, "/produtos/psyllium-200g.jpg"],
  [/serum.*vitamina c/, "/produtos/serum-vitamina-c-30ml.jpg"],
];

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function imagemCatalogo(nome: string, imagemAtual?: string | null) {
  const produtoRotulo = matchConsultationProduct(nome);
  if (produtoRotulo) return consultationImage(produtoRotulo);
  const nomeNormalizado = normalizar(nome);
  return imagensCatalogo.find(([padrao]) => padrao.test(nomeNormalizado))?.[1] ?? imagemAtual ?? null;
}

export function comImagemCatalogo(produto: Produto): Produto {
  return { ...aplicarPrecoCatalogo(produto), imagem_url: imagemCatalogo(produto.nome, produto.imagem_url) };
}
