"use client";

import Link from "next/link";
import { useState } from "react";
import type { Produto } from "@/lib/types";
import { useCart } from "./cart-provider";
import { useFavorites } from "./favorites-provider";
import { ProductImage } from "./product-image";
import { matchConsultationProduct } from "@/lib/consultation-products";
import { CartGlyph } from "./catalog-card-details";

const moeda = (valor: number) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ProductCard({ produto }: { produto: Produto }) {
  const { adicionar } = useCart();
  const { estaFavorito, alternarFavorito } = useFavorites();
  const [adicionado, setAdicionado] = useState(false);
  function adicionarProduto() {
    adicionar(produto);
    setAdicionado(true);
    window.setTimeout(() => setAdicionado(false), 1400);
  }
  const desconto = produto.preco_antigo && Number(produto.preco_antigo) > Number(produto.preco)
    ? Math.round((1 - Number(produto.preco) / Number(produto.preco_antigo)) * 100) : 0;
  const testo = /testo\s*\+/i.test(produto.nome);
  const rotulo = matchConsultationProduct(produto.nome);
  const apresentacao = rotulo?.apresentacao ?? produto.nome.match(/\b(?:\d+\s*(?:g|kg|ml|cápsulas|capsulas|ui|doses))\b/i)?.[0] ?? "";
  return (
    <article className={`card pharmacy-card mockup-product-card${testo ? " mockup-testo-card" : ""}`}>
      <div className="mockup-product-visual">
        <Link href={`/produto/${produto.id}`} className="photo mockup-photo" aria-label={`Ver ${produto.nome}`}>
          {!!desconto && <span className="discount-badge">-{desconto}%</span>}
          <ProductImage nome={produto.nome} imagemAtual={produto.imagem_url} />
        </Link>
        <button className={`favorite-button ${estaFavorito(produto.id) ? "active" : ""}`} onClick={() => alternarFavorito(produto)} aria-label={estaFavorito(produto.id) ? `Remover ${produto.nome} dos favoritos` : `Adicionar ${produto.nome} aos favoritos`}>
          <svg viewBox="0 0 24 24"><path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" /></svg>
        </button>
      </div>
      <div className="mockup-product-copy">
        <span className="mockup-category">{produto.categoria}</span>
        <Link href={`/produto/${produto.id}`} className="mockup-product-title"><h3>{produto.nome}</h3></Link>
        <span className="mockup-presentation">{apresentacao || "Botica Bioenergética"}</span>
        <div className="mockup-product-footer">
          <div className="mockup-price-group">
            {!!desconto && <del>{moeda(produto.preco_antigo!)}</del>}
            <strong>{moeda(produto.preco)}</strong>
            <small>{produto.estoque > 0 ? "Disponível" : "Indisponível"}</small>
          </div>
          <button type="button" className={`buy mockup-cart-button ${adicionado ? "added" : ""}`} disabled={produto.estoque < 1} onClick={adicionarProduto} aria-label={produto.estoque < 1 ? `${produto.nome} indisponível` : `Adicionar ${produto.nome} ao carrinho`}>
            <CartGlyph />
          </button>
        </div>
        {produto.estoque > 0 && produto.estoque <= 5 && <em className="mockup-low-stock">Restam poucas unidades</em>}
      </div>
    </article>
  );
}
