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
  return (
    <article className="card">
      <Link href={`/produto/${produto.id}`} className={`photo p${(produto.id % 5) + 1}`}>
        {produto.imagem_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={produto.imagem_url} alt={produto.nome} />
        ) : (
          <div className="jar"><i /><b>BOTICA</b><small>{produto.categoria}</small></div>
        )}
      </Link>
      <p>{produto.categoria}</p>
      <Link href={`/produto/${produto.id}`}><h3>{produto.nome}</h3></Link>
      {produto.preco_antigo && <del>{moeda(produto.preco_antigo)}</del>}
      <strong>{moeda(produto.preco)}</strong>
      <small>{produto.estoque > 0 ? `ou 2x de ${moeda(Number(produto.preco) / 2)}` : "Indisponível"}</small>
      <button className={`buy ${adicionado ? "added" : ""}`} disabled={produto.estoque < 1} onClick={adicionarProduto}>
        {adicionado ? "✓ ADICIONADO" : "ADICIONAR AO CARRINHO"}
      </button>
    </article>
  );
}
