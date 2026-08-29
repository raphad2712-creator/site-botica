"use client";

import Link from "next/link";
import { useState } from "react";
import type { Produto } from "@/lib/types";
import { useCart } from "./cart-provider";

const moeda = (valor: number) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ProductCard({ produto }: { produto: Produto }) {
  const { adicionar } = useCart();
  const [adicionado, setAdicionado] = useState(false);

  function adicionarProduto() {
    adicionar(produto);
    setAdicionado(true);
    window.setTimeout(() => setAdicionado(false), 1400);
  }
  const desconto = produto.preco_antigo && Number(produto.preco_antigo) > Number(produto.preco)
    ? Math.round((1 - Number(produto.preco) / Number(produto.preco_antigo)) * 100)
    : 0;
  return (
    <article className="card">
      <Link href={`/produto/${produto.id}`} className={`photo p${(produto.id % 5) + 1}`}>
        {!!desconto && <span className="discount-badge">-{desconto}%</span>}
        {produto.imagem_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={produto.imagem_url} alt={produto.nome} />
        ) : (
          <div className="jar"><i /><b>BOTICA</b><small>{produto.categoria}</small></div>
        )}
      </Link>
      <p>{produto.categoria}</p>
      <Link href={`/produto/${produto.id}`}><h3>{produto.nome}</h3></Link>
      <span className="card-rating" aria-label="Produto selecionado pela Botica">★★★★★ <small>seleção Botica</small></span>
      {produto.preco_antigo && <del>{moeda(produto.preco_antigo)}</del>}
      <strong>{moeda(produto.preco)}</strong>
      <small>{produto.estoque > 0 ? `ou 2x de ${moeda(Number(produto.preco) / 2)} sem juros` : "Indisponível"}</small>
      {produto.estoque > 0 && produto.estoque <= 5 && <em className="low-stock">Restam poucas unidades</em>}
      <button className={`buy ${adicionado ? "added" : ""}`} disabled={produto.estoque < 1} onClick={adicionarProduto}>
        {adicionado ? "✓ ADICIONADO" : "ADICIONAR AO CARRINHO"}
      </button>
    </article>
  );
}
