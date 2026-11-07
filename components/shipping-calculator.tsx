"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { formatarCep, type CotacaoFrete } from "@/lib/frete";
import { Icon } from "./ui-icon";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ShippingCalculator({ subtotal, produtoId, quantidade = 1 }: { subtotal: number; produtoId?: number; quantidade?: number }) {
  const consulta = useRef(0);
  useEffect(() => () => { consulta.current++; }, []);
  const [cep, setCep] = useState("");
  const [cotacao, setCotacao] = useState<CotacaoFrete | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [calculando, setCalculando] = useState(false);

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem("botica-cep");
      if (salvo) setCep(formatarCep(salvo));
    } catch { /* O CEP pode ser digitado sem armazenamento local. */ }
  }, []);

  useEffect(() => {
    consulta.current++;
    setCotacao(null);
    setCalculando(false);
    setMensagem("");
  }, [subtotal, produtoId, quantidade]);

  async function calcular(event: FormEvent) {
    event.preventDefault();
    const atual = ++consulta.current;
    setCotacao(null);
    setMensagem("");
    setCalculando(true);
    try {
      const resposta = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep, subtotal, itens: produtoId ? [{ produto_id: produtoId, quantidade }] : [] }),
      });
      const dados = await resposta.json();
      if (atual !== consulta.current) return;
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível calcular o frete.");
      setCotacao(dados);
      try { window.localStorage.setItem("botica-cep", cep.replace(/\D/g, "")); } catch { /* A cotação independe do armazenamento local. */ }
    } catch (erro) {
      if (atual !== consulta.current) return;
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível calcular o frete.");
    } finally {
      if (atual === consulta.current) setCalculando(false);
    }
  }

  return <section className="product-shipping" aria-labelledby="shipping-title">
    <div><Icon name="truck" /><span><b id="shipping-title">Calcule o frete</b><small>Informe seu CEP para consultar valor e prazo</small></span></div>
    <form onSubmit={calcular}>
      <label><span className="sr-only">CEP</span><input aria-label="CEP para calcular o frete" inputMode="numeric" autoComplete="postal-code" value={cep} onChange={(event) => { consulta.current++; setCalculando(false); setCep(formatarCep(event.target.value)); setCotacao(null); setMensagem(""); }} placeholder="00000-000" /></label>
      <button disabled={calculando}>{calculando ? "CALCULANDO..." : "CALCULAR"}</button>
    </form>
    {cotacao && <div className="product-shipping-result" role="status"><span><b>{cotacao.servico} por {cotacao.transportadora}</b><small>{cotacao.prazoMinimo} a {cotacao.prazoMaximo} dias úteis para {cotacao.destino}{cotacao.estimado ? " • estimativa sujeita à confirmação" : ""}</small></span><strong>{cotacao.gratis ? "GRÁTIS" : moeda(cotacao.valor)}</strong></div>}
    {mensagem && <p role="alert">{mensagem}</p>}
  </section>;
}
