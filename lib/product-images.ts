import type { Produto } from "@/lib/types";
import { consultationImage, matchConsultationProduct } from "./consultation-products";

const imagensCatalogo: Array<[RegExp, string]> = [
  [/creatina monohidratada/, "/produtos/padrao/creatina-300g.webp"],
  [/melatonina.*gotas/, "/produtos/padrao/melatonina-gotas-20ml.png"],
  [/floral rescue/, "/produtos/padrao/floral-rescue-30ml.webp"],
  [/vitamina b12 1000/, "/produtos/padrao/vitamina-b12-1000mcg.png"],
  [/vit(?:amina)? b12|metilcobalamina/, "/produtos/padrao/vit-b12-metilcobalamina.webp"],
  [/vit(?:amina)? d(?:3)? 1000/, "/produtos/padrao/vit-d-1000ui.webp"],
  [/vitamina d3 2000/, "/produtos/padrao/vitamina-d3-2000ui.png"],
  [/psyllium/, "/produtos/padrao/psyllium-200g.png"],
  [/serum.*vitamina c/, "/produtos/padrao/serum-vitamina-c-30ml.png"],
];

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function imagemCatalogo(nome: string, imagemAtual?: string | null) {
  if (imagemAtual) return imagemAtual;
  const produtoRotulo = matchConsultationProduct(nome);
  if (produtoRotulo) return consultationImage(produtoRotulo);
  const nomeNormalizado = normalizar(nome);
  return imagensCatalogo.find(([padrao]) => padrao.test(nomeNormalizado))?.[1] ?? null;
}

export function comImagemCatalogo(produto: Produto): Produto {
  return { ...produto, imagem_url: imagemCatalogo(produto.nome, produto.imagem_url) };
}
