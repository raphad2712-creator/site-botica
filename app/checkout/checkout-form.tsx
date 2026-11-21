"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { criarClienteSupabase } from "@/lib/supabase/client";
import type { PerfilCliente } from "@/components/profile-editor";
import { ProductImage } from "@/components/product-image";
import { Icon } from "@/components/ui-icon";
import { formatarCep, type CotacaoFrete } from "@/lib/frete";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CheckoutPage({ modoTeste = false }: { modoTeste?: boolean }) {
  const { itens, total } = useCart();
  const consultaFrete = useRef(0);
  const autoConsultaFrete = useRef("");
  const timerFrete = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chaveCarrinho = JSON.stringify(itens.map(({ id, quantidade }) => [id, quantidade]));
  const [mensagem, setMensagem] = useState("");
  const [cepFrete, setCepFrete] = useState("");
  const [cotacaoFrete, setCotacaoFrete] = useState<CotacaoFrete | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [metodoPagamento, setMetodoPagamento] = useState<"pix" | "cartao">("pix");
  const [verificandoLogin, setVerificandoLogin] = useState(true);
  const [perfil, setPerfil] = useState<PerfilCliente>({});

  useEffect(() => {
    let ativo = true;
    criarClienteSupabase().auth.getUser().then(async ({ data }) => {
      if (!ativo) return;
      if (!data.user) {
        window.location.replace("/login?next=/checkout");
        return;
      }
      try { const resposta = await fetch("/api/perfil", { cache: "no-store" }); const dados = await resposta.json(); if (resposta.ok) { setPerfil(dados.perfil ?? {}); const cepInicial = dados.perfil?.cep || window.localStorage.getItem("botica-cep"); if (cepInicial) setCepFrete(formatarCep(String(cepInicial))); } } catch { /* checkout continua editável */ }
      setVerificandoLogin(false);
    }).catch(() => window.location.replace("/login?next=/checkout"));
    return () => { ativo = false; };
  }, [modoTeste]);

  useEffect(() => { consultaFrete.current++; setCalculando(false); setCotacaoFrete(null); }, [total, chaveCarrinho]);
  useEffect(() => () => { consultaFrete.current++; if (timerFrete.current) clearTimeout(timerFrete.current); }, []);

  useEffect(() => {
    const cepNumerico = cepFrete.replace(/\D/g, "");
    const chave = `${cepNumerico}:${chaveCarrinho}:${total}`;
    if (cepNumerico.length !== 8 || !itens.length || autoConsultaFrete.current === chave) return;
    timerFrete.current = setTimeout(() => { void calcularFrete(); }, 650);
    return () => { if (timerFrete.current) clearTimeout(timerFrete.current); };
  }, [cepFrete, chaveCarrinho, total]);

  async function calcularFrete() {
    if (timerFrete.current) { clearTimeout(timerFrete.current); timerFrete.current = null; }
    const cepNumerico = cepFrete.replace(/\D/g, "");
    if (cepNumerico.length !== 8) return setMensagem("Digite um CEP válido com 8 números.");
    autoConsultaFrete.current = `${cepNumerico}:${chaveCarrinho}:${total}`;
    const atual = ++consultaFrete.current;
    setCotacaoFrete(null);
    setCalculando(true);
    setMensagem("");
    try {
      const resposta = await fetch("/api/frete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cep: cepFrete, subtotal: total, itens: itens.map(({ id, quantidade }) => ({ produto_id: id, quantidade })) }) });
      const dados = await resposta.json();
      if (atual !== consultaFrete.current) return;
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível calcular o frete.");
      setCotacaoFrete(dados);
      try { window.localStorage.setItem("botica-cep", cepFrete.replace(/\D/g, "")); } catch { /* A cotação continua válida. */ }
      setMensagem(`Frete calculado para ${dados.destino}.`);
    } catch (erro) {
      if (atual !== consultaFrete.current) return;
      setCotacaoFrete(null);
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível calcular o frete.");
    } finally {
      if (atual === consultaFrete.current) setCalculando(false);
    }
  }

  async function finalizar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (processando) return;
    if (modoTeste) {
      const form = Object.fromEntries(new FormData(event.currentTarget));
      if (cotacaoFrete === null) return setMensagem("Calcule o frete antes de confirmar o pedido.");
      setProcessando(true);
      setMensagem("Registrando seu pedido...");
      try {
        const resposta = await fetch("/api/pedidos/teste", {
          method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cliente: form, metodo_pagamento: metodoPagamento, itens: itens.map(({ id, quantidade }) => ({ produto_id: id, quantidade })) }),
        });
        const dados = await resposta.json();
        if (resposta.status === 401) { window.location.assign("/login?next=/checkout"); return; }
        if (!resposta.ok) { setMensagem(dados.erro || "Não foi possível registrar o pedido."); return; }
        if (!dados.checkout_url) { setMensagem("O pedido foi salvo, mas não foi possível abrir o comprovante."); return; }
        window.location.assign(dados.checkout_url);
      } catch {
        setMensagem("Não foi possível conectar. Tente novamente.");
      } finally {
        setProcessando(false);
      }
      return;
    }
    if (itens.some((item) => item.estoque_confirmado !== true)) return;
    const form = Object.fromEntries(new FormData(event.currentTarget));
    if (cotacaoFrete === null) return setMensagem("Calcule o frete antes de confirmar o pedido.");
    setProcessando(true);
    setMensagem("Criando seu pedido...");
    try {
      const resposta = await fetch("/api/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ cliente: form, metodo_pagamento: metodoPagamento, itens: itens.map(({ id, quantidade }) => ({ produto_id: id, quantidade })) }) });
      const dados = await resposta.json();
      if (resposta.status === 401) {
        window.location.assign("/login?next=/checkout");
        return;
      }
      if (!resposta.ok) return setMensagem(dados.erro ?? "Não foi possível finalizar.");
      if (!dados.checkout_url) return setMensagem("O checkout de pagamento não foi disponibilizado.");
      setMensagem(`Abrindo o pagamento por ${metodoPagamento === "pix" ? "Pix" : "cartão de crédito"}...`);
      window.location.assign(dados.checkout_url);
    } catch {
      setMensagem("Não foi possível conectar. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  }

  if (verificandoLogin) return <section className="checkout-auth-loading"><span className="auth-spinner" /><h1>Verificando sua conta</h1><p>Aguarde um instante para continuar com segurança.</p></section>;

  if (!itens.length) return <section className="empty-page"><h1>Seu carrinho está vazio</h1><p>Adicione pelo menos um produto para iniciar a finalização.</p><a href="/">VER PRODUTOS</a></section>;

  const pendentes = itens.filter((item) => item.estoque_confirmado !== true);
  if (pendentes.length && !modoTeste) return <section className="empty-page"><h1>Estoque a confirmar</h1><p>{pendentes.map((item) => item.nome).join(", ")} {pendentes.length === 1 ? "está" : "estão"} no seu carrinho. A Botica precisa confirmar a disponibilidade antes de liberar o pagamento.</p><a href="/carrinho">VOLTAR AO CARRINHO</a></section>;

  return (
    <div className="checkout-page">
      <div className="checkout-title"><small>COMPRA SEGURA</small><h1>Pagar</h1><p>Confira os dados, o frete e escolha como deseja pagar.</p><div className="checkout-progress" aria-label="Etapas da finalização"><span className="active"><b>1</b>Identificação</span><i /><span className="active"><b>2</b>Entrega</span><i /><span><b>3</b>Pagamento</span></div></div>
      <form onSubmit={finalizar} className="checkout-layout">
        <div className="checkout-forms">
          <section><header><b>1</b><div><h2>Seus dados</h2><small>Preenchidos pela sua conta e editáveis antes do pagamento</small></div></header><div className="form-grid"><label>Nome completo<input name="nome" defaultValue={perfil.nome ?? ""} required /></label><label>E-mail<input name="email" type="email" defaultValue={perfil.email ?? ""} required /></label><label>Telefone (opcional)<input name="telefone" inputMode="tel" defaultValue={perfil.telefone ?? ""} /></label><label>CPF{modoTeste ? " (opcional por enquanto)" : ""}<input name="cpf" inputMode="numeric" defaultValue={perfil.cpf ?? ""} required={!modoTeste} /></label></div></section>
          <section><header><b>2</b><div><h2>Endereço de entrega</h2><small>Use o endereço salvo ou altere para este pedido</small></div></header><div className="form-grid"><label className={`cep-field ${cotacaoFrete !== null ? "cep-ok" : ""}`}>CEP<div><input name="cep" inputMode="numeric" value={cepFrete} onChange={(e) => { consultaFrete.current++; setCalculando(false); setCepFrete(formatarCep(e.target.value)); setCotacaoFrete(null); setMensagem(""); }} placeholder="00000-000" required /><button type="button" className={calculando ? "loading" : ""} onClick={calcularFrete} disabled={calculando}>{calculando ? <><i /> CALCULANDO...</> : cotacaoFrete !== null ? <><Icon name="check" /> RECALCULAR</> : "CALCULAR FRETE"}</button></div>{cotacaoFrete !== null && <span className="cep-confirmation"><b><Icon name="check" /></b> CEP confirmado: {cotacaoFrete.destino}</span>}</label><label>Rua<input name="rua" defaultValue={perfil.rua ?? ""} required /></label><label>Número<input name="numero" defaultValue={perfil.numero ?? ""} required /></label><label>Complemento<input name="complemento" defaultValue={perfil.complemento ?? ""} /></label><label>Bairro<input name="bairro" defaultValue={perfil.bairro ?? ""} required /></label><label>Cidade<input name="cidade" defaultValue={perfil.cidade ?? ""} required /></label><label>Estado<input name="estado" defaultValue={perfil.estado ?? ""} maxLength={2} required /></label></div></section>
          <section><header><b>3</b><div><h2>Entrega</h2><small>Valor e prazo calculados pelo CEP</small></div></header>{cotacaoFrete === null ? <p className="shipping-pending">Informe o CEP acima e clique em “Calcular frete”.</p> : <label className="delivery-option"><input type="radio" name="entrega" value={String(cotacaoFrete.servicoId ?? "padrao")} defaultChecked /><span><b>{cotacaoFrete.servico} por {cotacaoFrete.transportadora}</b><small>{cotacaoFrete.prazoMinimo} a {cotacaoFrete.prazoMaximo} dias úteis para {cotacaoFrete.destino}{cotacaoFrete.estimado ? " • estimativa sujeita à confirmação" : ""}</small></span><strong>{cotacaoFrete.valor ? moeda(cotacaoFrete.valor) : "GRÁTIS"}</strong></label>}</section>
          <section><header><b>4</b><div><h2>Como deseja pagar?</h2><small>Escolha uma forma de pagamento</small></div></header><div className="payment-choice"><label className={metodoPagamento === "pix" ? "active" : ""}><input type="radio" name="metodo_pagamento" value="pix" checked={metodoPagamento === "pix"} onChange={() => setMetodoPagamento("pix")} /><b>Pix</b><small>Pagamento rápido e à vista</small></label><label className={metodoPagamento === "cartao" ? "active" : ""}><input type="radio" name="metodo_pagamento" value="cartao" checked={metodoPagamento === "cartao"} onChange={() => setMetodoPagamento("cartao")} /><b>Cartão de crédito</b><small>Parcele em até 6x sem juros</small></label></div><p className="payment-security"><Icon name="lock" /> {modoTeste ? "A forma de pagamento será confirmada antes de qualquer cobrança." : "Seus dados são protegidos durante todo o pagamento."}</p></section>
        </div>
        <aside className="order-summary"><h2>Resumo do pedido</h2>{itens.map((item) => <article key={item.id}><div className="summary-image"><ProductImage nome={item.nome} imagemAtual={item.imagem_url} /></div><div><b>{item.nome}</b><small>Quantidade: {item.quantidade}</small></div><strong>{moeda(Number(item.preco) * item.quantidade)}</strong></article>)}<div className="summary-line"><span>Subtotal</span><b>{moeda(total)}</b></div><div className="summary-line"><span>Frete</span><b>{cotacaoFrete === null ? "A calcular" : cotacaoFrete.valor ? moeda(cotacaoFrete.valor) : "Grátis"}</b></div><div className="summary-total"><span>Total</span><b>{moeda(total + (cotacaoFrete?.valor ?? 0))}</b></div><button disabled={processando}>{modoTeste ? processando ? "AGUARDE..." : "PAGAR" : processando ? "ABRINDO PAGAMENTO..." : metodoPagamento === "pix" ? "PAGAR COM PIX" : "PAGAR COM CARTÃO"}</button><p>{mensagem}</p><small>{modoTeste ? "O pedido será registrado sem cobrança agora; o pagamento será combinado com a Botica." : "Pagamento protegido e confirmação automática do pedido."}</small></aside>
      </form>
    </div>
  );
}
