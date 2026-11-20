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
  const disponivel = produto.estoque_confirmado === true && produto.estoque > 0;
  const pendente = produto.estoque_confirmado !== true;
  const contato = `mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "flavio_farmaceutico@hotmail.com"}?subject=${encodeURIComponent(`Disponibilidade de ${produto.nome}`)}&body=${encodeURIComponent(`Olá! Gostaria de confirmar a disponibilidade de ${produto.nome}.`)}`;
  const [adicionado, setAdicionado] = useState(false);
  function adicionarProduto() {
    if (!disponivel) return;
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
        <button className={`favorite-button ${estaFavorito(produto.id) ? "active" : ""}`} onClick={() => alternarFavorito(produto)} aria-pressed={estaFavorito(produto.id)} aria-label={estaFavorito(produto.id) ? `Remover ${produto.nome} dos favoritos` : `Adicionar ${produto.nome} aos favoritos`}>
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
            <small>{disponivel ? "Disponível" : pendente ? "Disponibilidade a confirmar" : "Sem estoque"}</small>
          </div>
          {pendente ? <a className="buy mockup-cart-button" href={contato} aria-label={`Consultar disponibilidade de ${produto.nome}`}>Consultar disponibilidade</a> :
            <button type="button" className={`buy mockup-cart-button ${adicionado ? "added" : ""}`} disabled={!disponivel} onClick={adicionarProduto} aria-label={disponivel ? `Adicionar ${produto.nome} ao carrinho` : `${produto.nome} sem estoque`}>
              <CartGlyph /><span aria-live="polite">{!disponivel ? "Sem estoque" : adicionado ? "Adicionado" : "Adicionar"}</span>
            </button>}
        </div>
        <Link className="catalog-details-link" href={`/produto/${produto.id}`}>Conhecer o produto</Link>
        {disponivel && produto.estoque <= 5 && <em className="mockup-low-stock">Restam poucas unidades</em>}
      </div>
    </article>
  );
}
