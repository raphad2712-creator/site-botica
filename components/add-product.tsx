"use client";

import { ShippingCalculator } from "./shipping-calculator";
import { useState } from "react";
import type { Produto } from "@/lib/types";
import { useCart } from "./cart-provider";

export function AddProduct({ produto }: { produto: Produto }) {
  const disponivel = produto.estoque_confirmado === true && produto.estoque > 0;
  const pendente = produto.estoque_confirmado !== true;
  const contato = `mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "flavio_farmaceutico@hotmail.com"}?subject=${encodeURIComponent(`Disponibilidade de ${produto.nome}`)}&body=${encodeURIComponent(`Olá! Gostaria de confirmar a disponibilidade de ${produto.nome}.`)}`;
  const [quantidade, setQuantidade] = useState(1);
  const [adicionado, setAdicionado] = useState(false);
  const { adicionar } = useCart();

  function adicionarProduto() {
    if (!disponivel || quantidade > produto.estoque) return;
    adicionar(produto, quantidade);
    setAdicionado(true);
    window.setTimeout(() => setAdicionado(false), 1400);
  }
  return (
    <>
      <div className="buy-box">
        {disponivel && <div className="quantity">
          <button onClick={() => setQuantidade((q) => Math.max(1, q - 1))}>−</button>
          <b>{quantidade}</b>
          <button onClick={() => setQuantidade((q) => Math.min(produto.estoque, q + 1))}>+</button>
        </div>}
        {pendente ? <a className="buy" href={contato}>CONSULTAR DISPONIBILIDADE</a> :
          <button disabled={!disponivel} className={adicionado ? "added" : ""} onClick={adicionarProduto}>
            {!disponivel ? "SEM ESTOQUE" : adicionado ? "ADICIONADO AO CARRINHO" : "ADICIONAR AO CARRINHO"}
          </button>}
      </div>
      {disponivel && <ShippingCalculator subtotal={Number(produto.preco) * quantidade} produtoId={Number(produto.id)} quantidade={quantidade} />}
    </>
  );
}
