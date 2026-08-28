"use client";

import { useState } from "react";
import type { Produto } from "@/lib/types";
import { useCart } from "./cart-provider";

export function AddProduct({ produto }: { produto: Produto }) {
  const [quantidade, setQuantidade] = useState(1);
  const [adicionado, setAdicionado] = useState(false);
  const { adicionar } = useCart();

  function adicionarProduto() {
    adicionar(produto, quantidade);
    setAdicionado(true);
    window.setTimeout(() => setAdicionado(false), 1400);
  }
  return (
    <div className="buy-box">
      <div className="quantity">
        <button onClick={() => setQuantidade((q) => Math.max(1, q - 1))}>−</button>
        <b>{quantidade}</b>
        <button onClick={() => setQuantidade((q) => q + 1)}>+</button>
      </div>
      <button className={adicionado ? "added" : ""} onClick={adicionarProduto}>
        {adicionado ? "✓ ADICIONADO AO CARRINHO" : "ADICIONAR AO CARRINHO"}
      </button>
    </div>
  );
}
