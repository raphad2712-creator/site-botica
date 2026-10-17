import type { ItemCarrinho, Produto } from "./types";

function produtoValido(value: unknown): value is Produto {
  if (!value || typeof value !== "object") return false;
  const p = value as Produto;
  return Number.isSafeInteger(p.id) && p.id > 0 && typeof p.nome === "string" && p.nome.length <= 200
    && typeof p.categoria === "string" && (typeof p.preco === "number" || (typeof p.preco === "string" && /^\d+(\.\d+)?$/.test(p.preco))) && Number.isFinite(Number(p.preco)) && Number(p.preco) >= 0
    && Number.isSafeInteger(p.estoque) && p.estoque >= 0;
}
export function lerProdutosSalvos(raw: string | null, carrinho: true): ItemCarrinho[];
export function lerProdutosSalvos(raw: string | null, carrinho?: false): Produto[];
export function lerProdutosSalvos(raw: string | null, carrinho = false): Produto[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<number>();
    return parsed.slice(0, 100).filter((p) => {
      if (!produtoValido(p) || seen.has(p.id)) return false;
      if (carrinho && (!Number.isSafeInteger((p as ItemCarrinho).quantidade) || (p as ItemCarrinho).quantidade < 1 || (p as ItemCarrinho).quantidade > 100)) return false;
      seen.add(p.id);
      return true;
    });
  } catch { return []; }
}
