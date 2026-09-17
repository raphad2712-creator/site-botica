"use client";

import { FormEvent, useState } from "react";

export default function CentralPrivacidadePage() {
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagemNewsletter, setMensagemNewsletter] = useState("");

  async function solicitar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setEnviando(true); setMensagem("");
    const form = new FormData(event.currentTarget);
    try {
      const resposta = await fetch("/api/privacidade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: form.get("tipo"), detalhes: form.get("detalhes") }) });
      const dados = await resposta.json();
      if (resposta.status === 401) { window.location.assign("/login?next=/privacidade"); return; }
      setMensagem(dados.mensagem ?? dados.erro ?? "Não foi possível enviar.");
      if (resposta.ok) event.currentTarget.reset();
    } catch { setMensagem("Não foi possível conectar. Tente novamente."); }
    finally { setEnviando(false); }
  }

  async function cancelarNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMensagemNewsletter("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    try {
      const resposta = await fetch("/api/newsletter/cancelar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const dados = await resposta.json(); setMensagemNewsletter(dados.mensagem ?? dados.erro ?? "Não foi possível cancelar.");
    } catch { setMensagemNewsletter("Não foi possível conectar. Tente novamente."); }
  }

  return <main className="privacy-center"><header><small>LGPD</small><h1>Central de Privacidade</h1><p>Consulte seus dados, retire consentimentos ou exerça seus direitos de forma gratuita.</p></header><div className="privacy-center-grid">
    <section><h2>Baixar meus dados</h2><p>Gere um arquivo JSON com cadastro, endereços, pedidos, receitas, pós-venda e preferências vinculadas à sua conta.</p><a className="privacy-action" href="/api/privacidade" download>BAIXAR CÓPIA DOS MEUS DADOS</a><small>É necessário entrar na sua conta.</small></section>
    <section><h2>Solicitação LGPD</h2><form onSubmit={solicitar}><label>Direito que deseja exercer<select name="tipo" required><option value="">Selecione</option><option value="acesso">Confirmação e acesso</option><option value="correcao">Correção</option><option value="eliminacao">Eliminação ou anonimização</option><option value="portabilidade">Portabilidade</option><option value="revogacao">Revogação do consentimento</option><option value="oposicao">Oposição ao tratamento</option><option value="outro">Outro assunto</option></select></label><label>Descreva a solicitação<textarea name="detalhes" minLength={10} maxLength={2000} required /></label><button disabled={enviando}>{enviando ? "ENVIANDO..." : "ENVIAR SOLICITAÇÃO"}</button></form>{mensagem && <p role="status">{mensagem}</p>}</section>
    <section><h2>Cancelar newsletter</h2><p>Retire gratuitamente a autorização para receber novidades e ofertas.</p><form onSubmit={cancelarNewsletter}><label>E-mail cadastrado<input name="email" type="email" required /></label><button>CANCELAR COMUNICAÇÕES</button></form>{mensagemNewsletter && <p role="status">{mensagemNewsletter}</p>}</section>
    <section><h2>Contato de privacidade</h2><p>Para dúvidas, incidentes ou solicitações que não possam ser concluídas aqui, escreva para o canal da Botica.</p><a href="mailto:raphad2712@gmail.com?subject=Privacidade%20e%20LGPD">raphad2712@gmail.com</a><a href="/politica-de-privacidade">LER A POLÍTICA DE PRIVACIDADE</a></section>
  </div></main>;
}
