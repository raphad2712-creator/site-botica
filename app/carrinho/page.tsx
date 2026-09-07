"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { ProductImage } from "@/components/product-image";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CarrinhoPage() {
  const { itens, total, alterarQuantidade, remover, limpar } = useCart();

  if (!itens.length) return <section className="empty-page"><h1>Seu carrinho está vazio</h1><Link href="/">Ver produtos</Link></section>;

  return (
    <section className="cart-page cart-page-modern">
      <div className="cart-page-head"><div><small>SUA COMPRA</small><h1>Meu carrinho</h1><p>Revise os produtos e as quantidades antes de continuar.</p></div><Link href="/#produtos">← Continuar comprando</Link></div>
      <div className="cart-page-layout"><div className="cart-page-items">
      <div className={`cart-shipping-card ${total >= 210 ? "complete" : ""}`}><div><b>{total >= 210 ? "✓ Frete grátis conquistado" : `Faltam ${moeda(210 - total)} para o frete grátis`}</b><small>Frete grátis nas compras a partir de R$ 210</small></div><span>{Math.min(100, Math.round(total / 2.1))}%</span></div>
      {itens.map((item) => (
        <article key={item.id}>
          <div className="cart-page-product-image"><ProductImage nome={item.nome} /></div>
          <div><b>{item.nome}</b><small>{moeda(Number(item.preco))} cada</small></div>
          <div className="quantity">
            <button onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}>−</button>
            <b>{item.quantidade}</b>
            <button onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}>+</button>
          </div>
          <strong>{moeda(Number(item.preco) * item.quantidade)}</strong>
          <button className="remove" onClick={() => remover(item.id)}>Remover</button>
        </article>
      ))}
      <button type="button" className="cart-clear" onClick={limpar}>Esvaziar carrinho</button></div>
      <aside className="cart-page-summary"><small>RESUMO</small><h2>Resumo do pedido</h2><div><span>Produtos ({itens.reduce((soma, item) => soma + item.quantidade, 0)})</span><b>{moeda(total)}</b></div><div><span>Frete</span><b>Calculado no checkout</b></div><div className="cart-total"><span>Total parcial</span><b>{moeda(total)}</b></div><Link className="checkout cart-checkout-link" href="/checkout">FINALIZAR COMPRA</Link><p>Compra protegida e pagamento processado com segurança.</p></aside></div>
    </section>
  );
}
