"use client";

import { FormEvent, useState } from "react";

export function AdminNewsletter({ total }: { total: number }) {
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!total || enviando) return;
    setEnviando(true); setMensagem("");
    try {
      const form = Object.fromEntries(new FormData(event.currentTarget));
      const resposta = await fetch("/api/admin/newsletter", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const dados = await resposta.json();
      setMensagem(dados.mensagem || dados.erro || "Não foi possível enviar.");
      if (resposta.ok) event.currentTarget.reset();
    } catch { setMensagem("Não foi possível conectar ao serviço de envio."); }
    finally { setEnviando(false); }
  }

  return <section className="admin-newsletter" id="comunicados-admin">
    <div className="admin-panel-heading"><div><small>COMUNICAÇÃO</small><h2>Enviar novidades</h2><p>Escreva uma mensagem e envie para todos que aceitaram receber comunicações.</p></div><span>{total} INSCRITOS</span></div>
    <div className="admin-newsletter-layout">
      <form onSubmit={enviar}>
        <label>Assunto do e-mail<input name="assunto" maxLength={120} placeholder="Ex.: Novidades e ofertas da Botica" required /></label>
        <label>Título da mensagem<input name="titulo" maxLength={120} placeholder="Ex.: Uma novidade para cuidar de você" required /></label>
        <label>Mensagem<textarea name="mensagem" maxLength={4000} placeholder="Escreva aqui o conteúdo que os clientes receberão..." required /></label>
        <label>Texto do botão <input name="texto_botao" maxLength={40} placeholder="Ex.: VER PRODUTOS (opcional)" /></label>
        <label>Link do botão <input name="link_botao" type="url" placeholder="https://site-botica.vercel.app (opcional)" /></label>
        <button disabled={enviando || total === 0}>{enviando ? "ENVIANDO..." : `ENVIAR PARA ${total} INSCRITOS`}</button>
        {mensagem && <p role="status">{mensagem}</p>}
      </form>
      <aside><span>✉</span><h3>Antes de enviar</h3><ul><li>Revise o assunto e a mensagem.</li><li>Envie somente novidades relevantes.</li><li>O envio utiliza a conta Brevo configurada.</li><li>O plano gratuito possui limite diário.</li></ul><p>Os destinatários não enxergam os e-mails uns dos outros.</p></aside>
    </div>
  </section>;
}
