"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CarrinhoPage() {
  const { itens, total, alterarQuantidade, remover, limpar } = useCart();
  const [mensagem, setMensagem] = useState("");

  async function finalizar() {
    setMensagem("Criando pedido...");
    const resposta = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itens: itens.map(({ id, quantidade }) => ({ produto_id: id, quantidade })) }),
    });
    const dados = await resposta.json();
    if (!resposta.ok) return setMensagem(dados.erro ?? "Não foi possível criar o pedido.");
    limpar();
    setMensagem(`Pedido #${dados.pedido_id} criado com sucesso.`);
  }

  if (!itens.length) return <section className="empty-page"><h1>Seu carrinho está vazio</h1><Link href="/">Ver produtos</Link>{mensagem && <p>{mensagem}</p>}</section>;

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
      <button className="checkout" onClick={finalizar}>CRIAR PEDIDO</button>
      <p className="form-message">{mensagem}</p>
      <small>O pagamento ainda é demonstrativo. Mercado Pago será integrado na próxima etapa.</small>
    </section>
  );
}
