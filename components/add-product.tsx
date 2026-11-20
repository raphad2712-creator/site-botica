"use client";

import { ShippingCalculator } from "./shipping-calculator";
import { useState } from "react";
import type { Produto } from "@/lib/types";
import { useCart } from "./cart-provider";

export function AddProduct({ produto }: { produto: Produto }) {
  const disponivel = produto.estoque_confirmado === true && produto.estoque > 0;
  const pendente = produto.estoque_confirmado !== true;
  const [quantidade, setQuantidade] = useState(1);
  const [adicionado, setAdicionado] = useState(false);
  const { adicionar } = useCart();

  function adicionarProduto() {
    if ((!disponivel && !pendente) || quantidade > (pendente ? 100 : produto.estoque)) return;
    adicionar(produto, quantidade);
    setAdicionado(true);
    window.setTimeout(() => setAdicionado(false), 1400);
  }
  return (
    <>
      <div className="buy-box">
        {(disponivel || pendente) && <div className="quantity">
          <button onClick={() => setQuantidade((q) => Math.max(1, q - 1))}>−</button>
          <b>{quantidade}</b>
          <button onClick={() => setQuantidade((q) => Math.min(pendente ? 100 : produto.estoque, q + 1))}>+</button>
        </div>}
        <button disabled={!disponivel && !pendente} className={adicionado ? "added" : ""} onClick={adicionarProduto}>
          {!disponivel && !pendente ? "SEM ESTOQUE" : adicionado ? "ADICIONADO AO CARRINHO" : "ADICIONAR AO CARRINHO"}
        </button>
      </div>
      {disponivel && <ShippingCalculator subtotal={Number(produto.preco) * quantidade} produtoId={Number(produto.id)} quantidade={quantidade} />}
    </>
  );
}
