import type { Produto } from "@/lib/types";

const imagensCatalogo: Array<[RegExp, string]> = [
  [/creatina monohidratada/, "/produtos/creatina-monohidratada-300g.jpg"],
  [/melatonina.*gotas/, "/produtos/melatonina-gotas-20ml.jpg"],
  [/floral rescue/, "/produtos/floral-rescue-30ml.jpg"],
  [/vitamina b12/, "/produtos/vitamina-b12-1000mcg.jpg"],
  [/vitamina d3/, "/produtos/vitamina-d3-2000ui.jpg"],
  [/psyllium/, "/produtos/psyllium-200g.jpg"],
  [/serum.*vitamina c/, "/produtos/serum-vitamina-c-30ml.jpg"],
];

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function imagemCatalogo(nome: string, imagemAtual?: string | null) {
  const nomeNormalizado = normalizar(nome);
  return imagensCatalogo.find(([padrao]) => padrao.test(nomeNormalizado))?.[1] ?? imagemAtual ?? null;
}

export function comImagemCatalogo(produto: Produto): Produto {
  return { ...produto, imagem_url: imagemCatalogo(produto.nome, produto.imagem_url) };
}
