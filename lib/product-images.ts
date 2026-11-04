import type { Produto } from "@/lib/types";
import { consultationImage, matchConsultationProduct, aplicarPrecoCatalogo } from "./consultation-products";

const imagensCatalogo: Array<[RegExp, string]> = [
  [/creatina monohidratada/, "/produtos/padrao/creatina-300g.webp"],
  [/melatonina.*gotas/, "/produtos/melatonina-gotas-20ml.jpg"],
  [/floral rescue/, "/produtos/padrao/floral-rescue-30ml.webp"],
  [/vit(?:amina)? b12|metilcobalamina/, "/produtos/padrao/vit-b12-metilcobalamina.webp"],
  [/vit(?:amina)? d(?:3)? 1000/, "/produtos/padrao/vit-d-1000ui.webp"],
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
