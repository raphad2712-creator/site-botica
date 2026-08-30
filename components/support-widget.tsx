"use client";

import Link from "next/link";
import { useState } from "react";

const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "raphad2712@gmail.com";

export function SupportWidget() {
  const [aberto, setAberto] = useState(false);
  const [faq, setFaq] = useState<number | null>(null);
  const assunto = encodeURIComponent("Atendimento — site Botica Bioenergética");

  return (
    <div className={`support-widget ${aberto ? "open" : ""}`}>
      {aberto && <button className="support-backdrop" onClick={() => setAberto(false)} aria-label="Fechar central de ajuda" />}
      {aberto && <section className="support-panel" aria-label="Central de ajuda">
        <header><div><small>ATENDIMENTO BOTICA</small><h2>Como podemos ajudar?</h2><p>Escolha uma opção para continuar.</p></div><button onClick={() => setAberto(false)} aria-label="Fechar suporte">×</button></header>
        <div className="support-shortcuts">
          <Link href="/minha-conta#pedidos" onClick={() => setAberto(false)}>Acompanhar pedido <span>→</span></Link>
          <Link href="/minha-conta#pedidos" onClick={() => setAberto(false)}>Trocas e reembolso <span>→</span></Link>
          <a href="/#receita" onClick={() => setAberto(false)}>Enviar receita <span>→</span></a>
          <a href={`mailto:${email}?subject=${assunto}`}>Falar com atendente <span>→</span></a>
        </div>
        <div className="support-faq">
          <button onClick={() => setFaq(faq === 1 ? null : 1)}>Qual é o prazo de entrega?<b>{faq === 1 ? "−" : "+"}</b></button>
          {faq === 1 && <p>O prazo é informado no fechamento do pedido e começa após a confirmação do pagamento.</p>}
          <button onClick={() => setFaq(faq === 2 ? null : 2)}>Como envio minha receita?<b>{faq === 2 ? "−" : "+"}</b></button>
          {faq === 2 && <p>Use a opção “Enviar receita” e anexe uma foto legível ou um arquivo PDF.</p>}
          <button onClick={() => setFaq(faq === 3 ? null : 3)}>Como solicito um reembolso?<b>{faq === 3 ? "−" : "+"}</b></button>
          {faq === 3 && <p>Entre na sua conta, abra “Meus pedidos” e selecione “Solicitar troca, devolução ou reembolso”. A solicitação ficará em análise e você receberá as atualizações por e-mail.</p>}
        </div>
        <small className="support-email">Atendimento: {email}</small>
      </section>}
      <button className="support-trigger" onClick={() => setAberto(!aberto)} aria-expanded={aberto} aria-label={aberto ? "Fechar central de ajuda" : "Abrir central de ajuda"}>
        {aberto ? <span>×</span> : <><svg viewBox="0 0 24 24"><path d="M5 11a7 7 0 0 1 14 0v5M5 13H3v4h4v-4H5ZM19 13h2v4h-4v-4h2ZM17 19c-1 1-2.7 2-5 2" /></svg><span>Precisa de ajuda?</span></>}
      </button>
    </div>
  );
}
