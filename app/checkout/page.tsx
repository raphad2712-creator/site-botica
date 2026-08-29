"use client";

import { FormEvent, useState } from "react";
import { useCart } from "@/components/cart-provider";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CheckoutPage() {
  const { itens, total } = useCart();
  const [mensagem, setMensagem] = useState("");
  const [cepFrete, setCepFrete] = useState("");
  const [frete, setFrete] = useState<number | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [processando, setProcessando] = useState(false);

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
      const resposta = await fetch("/api/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ cliente: form, itens: itens.map(({ id, quantidade }) => ({ produto_id: id, quantidade })), frete }) });
      const dados = await resposta.json();
      if (resposta.status === 401) return setMensagem("Entre na sua conta antes de confirmar. Seu carrinho continuará salvo.");
      if (!resposta.ok) return setMensagem(dados.erro ?? "Não foi possível finalizar.");
      if (!dados.checkout_url) return setMensagem("O checkout de pagamento não foi disponibilizado.");
      setMensagem("Redirecionando para o ambiente seguro do Mercado Pago...");
      window.location.assign(dados.checkout_url);
    } catch {
      setMensagem("Não foi possível conectar. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  }

  if (!itens.length) return <section className="empty-page"><h1>Seu carrinho está vazio</h1><p>Adicione pelo menos um produto para iniciar a finalização.</p><a href="/">VER PRODUTOS</a></section>;

  return (
    <main className="checkout-page">
      <div className="checkout-title"><small>COMPRA SEGURA</small><h1>Finalizar compra</h1><p>Confira os dados antes de seguir para o ambiente seguro do Mercado Pago.</p></div>
      <form onSubmit={finalizar} className="checkout-layout">
        <div className="checkout-forms">
          <section><header><b>1</b><div><h2>Seus dados</h2><small>Para identificação do pedido</small></div></header><div className="form-grid"><label>Nome completo<input name="nome" required /></label><label>E-mail<input name="email" type="email" required /></label><label>Telefone<input name="telefone" required /></label><label>CPF<input name="cpf" required /></label></div></section>
          <section><header><b>2</b><div><h2>Endereço de entrega</h2><small>Informe onde deseja receber</small></div></header><div className="form-grid"><label className={`cep-field ${frete !== null ? "cep-ok" : ""}`}>CEP<div><input name="cep" inputMode="numeric" value={cepFrete} onChange={(e) => { setCepFrete(formatarCep(e.target.value)); setFrete(null); setMensagem(""); }} placeholder="00000-000" required /><button type="button" className={calculando ? "loading" : ""} onClick={calcularFrete} disabled={calculando}>{calculando ? <><i /> CALCULANDO...</> : frete !== null ? "✓ RECALCULAR" : "CALCULAR FRETE"}</button></div>{frete !== null && <span className="cep-confirmation"><b>✓</b> CEP confirmado e frete calculado</span>}</label><label>Rua<input name="rua" required /></label><label>Número<input name="numero" required /></label><label>Complemento<input name="complemento" /></label><label>Bairro<input name="bairro" required /></label><label>Cidade<input name="cidade" required /></label><label>Estado<input name="estado" maxLength={2} required /></label></div></section>
          <section><header><b>3</b><div><h2>Entrega</h2><small>Calculada somente nesta etapa</small></div></header>{frete === null ? <p className="shipping-pending">Informe o CEP acima e clique em “Calcular frete”.</p> : <label className="delivery-option"><input type="radio" name="entrega" value="padrao" defaultChecked /><span><b>Entrega padrão</b><small>3 a 7 dias úteis</small></span><strong>{frete ? moeda(frete) : "GRÁTIS"}</strong></label>}</section>
          <section><header><b>4</b><div><h2>Pagamento</h2><small>Você escolherá a forma de pagamento na próxima tela</small></div></header><div className="payment-provider-card"><b>Mercado Pago</b><span>PIX ou cartão de crédito em até 6x</span><small>Os dados do cartão não passam pelo site da Botica.</small></div></section>
        </div>
        <aside className="order-summary"><h2>Resumo do pedido</h2>{itens.map((item) => <article key={item.id}><div className="summary-image">{item.imagem_url ? <img src={item.imagem_url} alt="" /> : <div className="mini-jar"><i /><b>BOTICA</b></div>}</div><div><b>{item.nome}</b><small>Quantidade: {item.quantidade}</small></div><strong>{moeda(Number(item.preco) * item.quantidade)}</strong></article>)}<div className="summary-line"><span>Subtotal</span><b>{moeda(total)}</b></div><div className="summary-line"><span>Frete</span><b>{frete === null ? "A calcular" : frete ? moeda(frete) : "Grátis"}</b></div><div className="summary-total"><span>Total</span><b>{moeda(total + (frete ?? 0))}</b></div><button disabled={processando}>{processando ? "ABRINDO PAGAMENTO..." : "IR PARA O PAGAMENTO SEGURO"}</button><p>{mensagem}</p><small>Pagamento processado com segurança pelo Mercado Pago.</small></aside>
      </form>
    </main>
  );
}
