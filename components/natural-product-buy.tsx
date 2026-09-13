"use client";

import { useRef, useState } from "react";
import type { ConsultationProduct } from "@/lib/consultation-products";
import { useCart } from "./cart-provider";

export function NaturalProductBuy({ produto, compact = false }: { produto: ConsultationProduct; compact?: boolean }) {
  const { adicionar } = useCart();
  const busy = useRef(false);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  async function add() {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/catalogo/${produto.slug}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || "Não foi possível adicionar. Tente novamente.");
      if (quantity > data.estoque) throw new Error(`Disponíveis: ${data.estoque} unidades.`);
      adicionar(data, quantity);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível adicionar. Tente novamente.");
    } finally { busy.current = false; setLoading(false); }
  }
  return <div className={compact ? "natural-buy compact" : "natural-buy"}>
    <div className={compact ? "" : "buy-box"}>
      {!compact && <div className="quantity"><button type="button" aria-label="Diminuir quantidade" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button><b>{quantity}</b><button type="button" aria-label="Aumentar quantidade" onClick={() => setQuantity(q => Math.min(100, q + 1))}>+</button></div>}
      <button type="button" className="buy" disabled={loading} onClick={add}>{loading ? "ADICIONANDO..." : "ADICIONAR AO CARRINHO"}</button>
    </div>
    {error && <p role="alert">{error}</p>}
  </div>;
}
