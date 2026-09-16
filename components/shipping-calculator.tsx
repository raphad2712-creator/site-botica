"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatarCep, type CotacaoFrete } from "@/lib/frete";
import { Icon } from "./ui-icon";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ShippingCalculator({ subtotal, produtoId }: { subtotal: number; produtoId?: number }) {
  const [cep, setCep] = useState("");
  const [cotacao, setCotacao] = useState<CotacaoFrete | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [calculando, setCalculando] = useState(false);

  useEffect(() => {
    const salvo = window.localStorage.getItem("botica-cep");
    if (salvo) setCep(formatarCep(salvo));
  }, []);

  async function calcular(event: FormEvent) {
    event.preventDefault();
    setCotacao(null);
    setMensagem("");
    setCalculando(true);
    try {
      const resposta = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep, subtotal, itens: produtoId ? [{ produto_id: produtoId, quantidade: 1 }] : [] }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível calcular o frete.");
      setCotacao(dados);
      window.localStorage.setItem("botica-cep", cep.replace(/\D/g, ""));
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível calcular o frete.");
    } finally {
      setCalculando(false);
    }
  }

  return <section className="product-shipping" aria-labelledby="shipping-title">
    <div><Icon name="truck" /><span><b id="shipping-title">Calcule o frete</b><small>Informe seu CEP para consultar valor e prazo</small></span></div>
    <form onSubmit={calcular}>
      <label><span className="sr-only">CEP</span><input aria-label="CEP para calcular o frete" inputMode="numeric" autoComplete="postal-code" value={cep} onChange={(event) => { setCep(formatarCep(event.target.value)); setCotacao(null); setMensagem(""); }} placeholder="00000-000" /></label>
      <button disabled={calculando}>{calculando ? "CALCULANDO..." : "CALCULAR"}</button>
    </form>
    {cotacao && <div className="product-shipping-result" role="status"><span><b>{cotacao.servico} por {cotacao.transportadora}</b><small>{cotacao.prazoMinimo} a {cotacao.prazoMaximo} dias úteis para {cotacao.destino}{cotacao.estimado ? " • valor estimado" : ""}</small></span><strong>{cotacao.gratis ? "GRÁTIS" : moeda(cotacao.valor)}</strong></div>}
    {mensagem && <p role="alert">{mensagem}</p>}
  </section>;
}
