"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CarrinhoPage() {
  const { itens, total, alterarQuantidade, remover } = useCart();

  if (!itens.length) return <section className="empty-page"><h1>Seu carrinho está vazio</h1><Link href="/">Ver produtos</Link></section>;

  return (
    <section className="cart-page">
      <h1>Meu carrinho</h1>
      {itens.map((item) => (
        <article key={item.id}>
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
      <div className="cart-total"><span>Total</span><b>{moeda(total)}</b></div>
      <Link className="checkout cart-checkout-link" href="/checkout">IR PARA A FINALIZAÇÃO</Link>
      <small>Confira seus dados, endereço e frete antes de confirmar o pedido.</small>
    </section>
  );
}
