"use client";

import { FormEvent, useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { criarClienteSupabase } from "@/lib/supabase/client";
import type { PerfilCliente } from "@/components/profile-editor";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CheckoutPage() {
  const { itens, total, limpar } = useCart();
  const [mensagem, setMensagem] = useState("");
  const [cepFrete, setCepFrete] = useState("");
  const [frete, setFrete] = useState<number | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [metodoPagamento, setMetodoPagamento] = useState<"pix" | "cartao">("pix");
  const [pix, setPix] = useState<{ codigo: string; qr_code_base64?: string; link?: string; pedido: number } | null>(null);
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
      try { const resposta = await fetch("/api/perfil", { cache: "no-store" }); const dados = await resposta.json(); if (resposta.ok) { setPerfil(dados.perfil ?? {}); if (dados.perfil?.cep) setCepFrete(formatarCep(String(dados.perfil.cep))); } } catch { /* checkout continua editável */ }
      setVerificandoLogin(false);
    }).catch(() => window.location.replace("/login?next=/checkout"));
    return () => { ativo = false; };
  }, []);

  async function calcularFrete() {
    const cep = cepFrete.replace(/\D/g, "");
    if (cep.length !== 8) return setMensagem("Digite um CEP válido com 8 números.");
    setCalculando(true);
    setMensagem("");
    await new Promise((resolve) => window.setTimeout(resolve, 850));
    setFrete(total >= 210 ? 0 : 18.9);
    setCalculando(false);
    setMensagem("Frete calculado: entrega estimada entre 3 e 7 dias úteis.");
  }

  function formatarCep(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 8);
    return numeros.length > 5 ? `${numeros.slice(0, 5)}-${numeros.slice(5)}` : numeros;
  }

  async function finalizar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (processando) return;
    const form = Object.fromEntries(new FormData(event.currentTarget));
    if (frete === null) return setMensagem("Calcule o frete antes de confirmar o pedido.");
    setProcessando(true);
    setMensagem("Criando seu pedido...");
    try {
      const resposta = await fetch("/api/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ cliente: form, itens: itens.map(({ id, quantidade }) => ({ produto_id: id, quantidade })), frete, metodo_pagamento: metodoPagamento }) });
      const dados = await resposta.json();
      if (resposta.status === 401) {
        window.location.assign("/login?next=/checkout");
        return;
      }
      if (!resposta.ok) return setMensagem(dados.erro ?? "Não foi possível finalizar.");
      if (dados.tipo === "teste") {
        limpar();
        setMensagem("Pedido de teste concluído. Abrindo sua conta...");
        window.location.assign(`/minha-conta?pedido=${dados.pedido_id}#pedidos`);
        return;
      }
      if (dados.tipo === "pix" && dados.pix?.codigo) {
        setPix({ ...dados.pix, pedido: dados.pedido_id });
        setMensagem("");
        return;
      }
      if (!dados.checkout_url) return setMensagem("O checkout de pagamento não foi disponibilizado.");
      setMensagem("Redirecionando para o ambiente seguro do Mercado Pago...");
      window.location.assign(dados.checkout_url);
    } catch {
      setMensagem("Não foi possível conectar. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  }

  async function copiarPix() {
    if (!pix) return;
    await navigator.clipboard.writeText(pix.codigo);
    setMensagem("Código Pix copiado. Abra o aplicativo do seu banco para pagar.");
  }

  if (verificandoLogin) return <section className="checkout-auth-loading"><span className="auth-spinner" /><h1>Verificando sua conta</h1><p>Aguarde um instante para continuar com segurança.</p></section>;
  if (pix) return <section className="pix-page"><small>PEDIDO #{pix.pedido}</small><h1>Pague com Pix</h1><p>Escaneie o QR Code ou copie o código abaixo. A confirmação do pedido será automática.</p>{pix.qr_code_base64 && <img src={`data:image/png;base64,${pix.qr_code_base64}`} alt="QR Code Pix do pedido" />}<div className="pix-code"><code>{pix.codigo}</code><button type="button" onClick={copiarPix}>COPIAR CÓDIGO PIX</button></div>{pix.link && <a href={pix.link} target="_blank" rel="noreferrer">ABRIR PÁGINA DO PIX</a>}<p className="pix-message">{mensagem}</p><a className="pix-account" href="/minha-conta">ACOMPANHAR PEDIDO</a></section>;

  if (!itens.length) return <section className="empty-page"><h1>Seu carrinho está vazio</h1><p>Adicione pelo menos um produto para iniciar a finalização.</p><a href="/">VER PRODUTOS</a></section>;

  return (
    <main className="checkout-page">
      <div className="checkout-title"><small>COMPRA SEGURA</small><h1>Finalizar compra</h1><p>Confira os dados antes de seguir para o ambiente seguro do Mercado Pago.</p></div>
      <form onSubmit={finalizar} className="checkout-layout">
        <div className="checkout-forms">
          <section><header><b>1</b><div><h2>Seus dados</h2><small>Preenchidos pela sua conta e editáveis antes do pagamento</small></div></header><div className="form-grid"><label>Nome completo<input name="nome" defaultValue={perfil.nome ?? ""} required /></label><label>E-mail<input name="email" type="email" defaultValue={perfil.email ?? ""} required /></label><label>Telefone (opcional)<input name="telefone" inputMode="tel" defaultValue={perfil.telefone ?? ""} /></label><label>CPF<input name="cpf" inputMode="numeric" defaultValue={perfil.cpf ?? ""} required /></label></div></section>
          <section><header><b>2</b><div><h2>Endereço de entrega</h2><small>Use o endereço salvo ou altere para este pedido</small></div></header><div className="form-grid"><label className={`cep-field ${frete !== null ? "cep-ok" : ""}`}>CEP<div><input name="cep" inputMode="numeric" value={cepFrete} onChange={(e) => { setCepFrete(formatarCep(e.target.value)); setFrete(null); setMensagem(""); }} placeholder="00000-000" required /><button type="button" className={calculando ? "loading" : ""} onClick={calcularFrete} disabled={calculando}>{calculando ? <><i /> CALCULANDO...</> : frete !== null ? "✓ RECALCULAR" : "CALCULAR FRETE"}</button></div>{frete !== null && <span className="cep-confirmation"><b>✓</b> CEP confirmado e frete calculado</span>}</label><label>Rua<input name="rua" defaultValue={perfil.rua ?? ""} required /></label><label>Número<input name="numero" defaultValue={perfil.numero ?? ""} required /></label><label>Complemento<input name="complemento" defaultValue={perfil.complemento ?? ""} /></label><label>Bairro<input name="bairro" defaultValue={perfil.bairro ?? ""} required /></label><label>Cidade<input name="cidade" defaultValue={perfil.cidade ?? ""} required /></label><label>Estado<input name="estado" defaultValue={perfil.estado ?? ""} maxLength={2} required /></label></div></section>
          <section><header><b>3</b><div><h2>Entrega</h2><small>Calculada somente nesta etapa</small></div></header>{frete === null ? <p className="shipping-pending">Informe o CEP acima e clique em “Calcular frete”.</p> : <label className="delivery-option"><input type="radio" name="entrega" value="padrao" defaultChecked /><span><b>Entrega padrão</b><small>3 a 7 dias úteis</small></span><strong>{frete ? moeda(frete) : "GRÁTIS"}</strong></label>}</section>
          <section><header><b>4</b><div><h2>Pagamento</h2><small>Escolha como deseja pagar</small></div></header><div className="payment-choice"><label className={metodoPagamento === "pix" ? "active" : ""}><input type="radio" name="pagamento" value="pix" checked={metodoPagamento === "pix"} onChange={() => setMetodoPagamento("pix")} /><b>PIX</b><small>Gerar QR Code e copia e cola</small></label><label className={metodoPagamento === "cartao" ? "active" : ""}><input type="radio" name="pagamento" value="cartao" checked={metodoPagamento === "cartao"} onChange={() => setMetodoPagamento("cartao")} /><b>Cartão</b><small>Pagamento seguro em até 6x</small></label></div><p className="payment-security">No Pix, você não preencherá dados de cartão. No cartão, o preenchimento acontece no ambiente seguro do Mercado Pago.</p></section>
        </div>
        <aside className="order-summary"><h2>Resumo do pedido</h2>{itens.map((item) => <article key={item.id}><div className="summary-image">{item.imagem_url ? <img src={item.imagem_url} alt="" /> : <div className="mini-jar"><i /><b>BOTICA</b></div>}</div><div><b>{item.nome}</b><small>Quantidade: {item.quantidade}</small></div><strong>{moeda(Number(item.preco) * item.quantidade)}</strong></article>)}<div className="summary-line"><span>Subtotal</span><b>{moeda(total)}</b></div><div className="summary-line"><span>Frete</span><b>{frete === null ? "A calcular" : frete ? moeda(frete) : "Grátis"}</b></div><div className="summary-total"><span>Total</span><b>{moeda(total + (frete ?? 0))}</b></div><button disabled={processando}>{processando ? (metodoPagamento === "pix" ? "GERANDO PIX..." : "ABRINDO PAGAMENTO...") : (metodoPagamento === "pix" ? "GERAR QR CODE PIX" : "PAGAR COM CARTÃO")}</button><p>{mensagem}</p><small>Pagamento processado com segurança pelo Mercado Pago.</small></aside>
      </form>
    </main>
  );
}
