"use client";

import Link from "next/link";
import { useState } from "react";
import type { Produto } from "@/lib/types";
import { useCart } from "./cart-provider";
import { useFavorites } from "./favorites-provider";
import { imagemCatalogoEscura } from "@/lib/product-images";

const moeda = (valor: number) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ProductCard({ produto }: { produto: Produto }) {
  const { adicionar } = useCart();
  const { estaFavorito, alternarFavorito } = useFavorites();
  const [adicionado, setAdicionado] = useState(false);
  const imagemEscura = imagemCatalogoEscura(produto.nome);

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
      <button className={`favorite-button ${estaFavorito(produto.id) ? "active" : ""}`} onClick={() => alternarFavorito(produto)} aria-label={estaFavorito(produto.id) ? `Remover ${produto.nome} dos favoritos` : `Adicionar ${produto.nome} aos favoritos`}>
        <svg viewBox="0 0 24 24"><path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" /></svg>
      </button>
      <Link href={`/produto/${produto.id}`} className={`photo p${(produto.id % 5) + 1}`}>
        {!!desconto && <span className="discount-badge">-{desconto}%</span>}
        {produto.imagem_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <>
            <img className={imagemEscura ? "product-image-light catalog-product-image" : "catalog-product-image"} src={produto.imagem_url} alt={produto.nome} />
            {imagemEscura && <img className="product-image-dark catalog-product-image" src={imagemEscura} alt="" aria-hidden="true" />}
          </>
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
