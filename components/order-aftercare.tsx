"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Pedido = {
  id: number; total: number; status: string; criado_em: string;
  transportadora?: string | null; codigo_rastreio?: string | null; link_rastreio?: string | null;
  status_entrega?: string | null; rastreio_atualizado_em?: string | null;
  itens_pedido?: Array<{ quantidade: number; preco_unitario: number; produto?: { id: number; nome: string; imagem_url?: string | null; categoria?: string | null } | Array<{ id: number; nome: string; imagem_url?: string | null; categoria?: string | null }> | null }>;
};
type Solicitacao = { id: number; pedido_id: number; tipo: string; status: string; motivo: string; resposta_admin?: string | null; criado_em: string };

const etapas = ["preparando", "postado", "em_transito", "saiu_para_entrega", "entregue"];
const rotulos: Record<string, string> = { preparando: "Em preparação", postado: "Postado", em_transito: "Em trânsito", saiu_para_entrega: "Saiu para entrega", entregue: "Entregue", atrasado: "Entrega atrasada" };

export function OrderAftercare({ pedidos, solicitacoes }: { pedidos: Pedido[]; solicitacoes: Solicitacao[] }) {
  const [aberto, setAberto] = useState<number | null>(null);
  const [detalhesAbertos, setDetalhesAbertos] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function solicitar(event: FormEvent<HTMLFormElement>, pedidoId: number) {
    event.preventDefault(); setEnviando(true); setMensagem("");
    const form = new FormData(event.currentTarget);
    const resposta = await fetch("/api/pos-venda", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedido_id: pedidoId, codigo_pedido: form.get("codigo_pedido"), tipo: form.get("tipo"), motivo: form.get("motivo"), detalhes: form.get("detalhes") }) });
    const data = await resposta.json();
    setMensagem(data.mensagem || data.erro || "Não foi possível enviar."); setEnviando(false);
    if (resposta.ok) setTimeout(() => window.location.reload(), 900);
  }

  const pedidosComProdutos = pedidos.filter((pedido) => pedido.itens_pedido?.length);
  if (!pedidosComProdutos.length) return <div className="account-empty"><span>⌑</span><h3>Você ainda não finalizou nenhum pedido</h3><p>Depois de concluir o checkout, sua compra aparecerá aqui com produtos, código e acompanhamento.</p><Link href="/#produtos">VER PRODUTOS</Link></div>;

  return <div className="account-orders order-list-modern">{pedidosComProdutos.map((pedido) => {
    const indice = Math.max(0, etapas.indexOf(pedido.status_entrega || "preparando"));
    const codigoPedido = `BOT-${new Date(pedido.criado_em).getFullYear()}-${String(pedido.id).padStart(6, "0")}`;
    const podeSolicitar = ["pago", "aprovado", "preparando", "enviado", "entregue"].includes(pedido.status);
    return <article className="order-card" key={pedido.id}>
      <header className="order-card-header"><div><small>CÓDIGO DO PEDIDO</small><h3>{codigoPedido}</h3></div><span>{rotulos[pedido.status_entrega || "preparando"] || "Em preparação"}</span></header>
      <div className="order-summary-row">
        <div className="order-number"><small>PEDIDO</small><b>#{pedido.id}</b></div>
        <div><small>DATA</small><span>{new Date(pedido.criado_em).toLocaleDateString("pt-BR")}</span></div>
        <div><small>PAGAMENTO</small><span className={`order-status status-${pedido.status}`}>{pedido.status.replaceAll("_", " ")}</span></div>
        <div className="order-total"><small>TOTAL</small><strong>{Number(pedido.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div>
      </div>
      <button className="order-details-toggle" type="button" onClick={() => setDetalhesAbertos(detalhesAbertos === pedido.id ? null : pedido.id)}><span>{detalhesAbertos === pedido.id ? "OCULTAR DETALHES" : "VER PRODUTOS E ACOMPANHAR ENTREGA"}</span><b>{detalhesAbertos === pedido.id ? "−" : "+"}</b></button>
      {detalhesAbertos === pedido.id && <div className="order-expanded-content">
      <div className="order-products"><h4>Produtos deste pedido</h4>{pedido.itens_pedido?.map((item, indice) => { const produto = Array.isArray(item.produto) ? item.produto[0] : item.produto; return <div className="order-product" key={`${produto?.id || 0}-${indice}`}><div className="order-product-image">{produto?.imagem_url ? <img src={produto.imagem_url} alt={produto.nome} /> : <span>BOTICA</span>}</div><div><b>{produto?.nome || "Produto"}</b><small>{produto?.categoria || "Produto Botica"}</small><span>Quantidade: {item.quantidade}</span></div><strong>{(Number(item.preco_unitario) * item.quantidade).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div>; })}</div>
      <div className="tracking-box">
        <div className="tracking-head"><div><small>ACOMPANHAMENTO DA ENTREGA</small><h3>{rotulos[pedido.status_entrega || "preparando"] || "Em preparação"}</h3></div>{pedido.codigo_rastreio && <button type="button" onClick={() => navigator.clipboard.writeText(pedido.codigo_rastreio!)}>Copiar código</button>}</div>
        <div className="tracking-steps">{etapas.map((etapa, i) => <div className={i <= indice && pedido.status_entrega !== "atrasado" ? "done" : ""} key={etapa}><i>{i < indice ? "✓" : i + 1}</i><span>{rotulos[etapa]}</span></div>)}</div>
        <div className="tracking-details"><span><small>TRANSPORTADORA</small>{pedido.transportadora || "Será informada após a postagem"}</span><span><small>CÓDIGO</small>{pedido.codigo_rastreio || "Aguardando postagem"}</span>{pedido.link_rastreio && <a href={pedido.link_rastreio} target="_blank" rel="noreferrer">ACOMPANHAR NO SITE DA TRANSPORTADORA ↗</a>}</div>
      </div>
      {podeSolicitar ? <button className="aftercare-open" type="button" onClick={() => { setAberto(aberto === pedido.id ? null : pedido.id); setMensagem(""); }}>{aberto === pedido.id ? "FECHAR" : "SOLICITAR TROCA, DEVOLUÇÃO OU REEMBOLSO"}</button> : <p className="aftercare-unavailable">Trocas e reembolsos ficam disponíveis após a confirmação do pagamento.</p>}
      {aberto === pedido.id && <form className="aftercare-form" onSubmit={(e) => solicitar(e, pedido.id)}>
        <label className="aftercare-order-code">Código do pedido<input name="codigo_pedido" required autoComplete="off" placeholder={codigoPedido} aria-describedby={`ajuda-codigo-${pedido.id}`} /><small id={`ajuda-codigo-${pedido.id}`}>Digite exatamente o código mostrado no topo deste pedido.</small></label>
        <label>O que você precisa?<select name="tipo" required><option value="arrependimento">Desistir da compra (direito de arrependimento)</option><option value="troca">Trocar produto</option><option value="devolucao">Devolver produto</option><option value="defeito">Produto com defeito ou avaria</option><option value="reembolso">Solicitar reembolso</option></select></label>
        <label>Motivo<input name="motivo" minLength={5} maxLength={160} required placeholder="Conte resumidamente o motivo" /></label>
        <label>Detalhes<textarea name="detalhes" maxLength={2000} placeholder="Informe o produto, o problema e outras informações importantes" /></label>
        <p>Ao enviar, a solicitação ficará em análise. Você receberá a confirmação e as próximas orientações por e-mail.</p>
        <button disabled={enviando}>{enviando ? "ENVIANDO..." : "ENVIAR SOLICITAÇÃO"}</button>
        {mensagem && <strong className="aftercare-message">{mensagem}</strong>}
        <Link href="/politica-de-trocas-e-devolucoes">Consultar política de trocas, devoluções e reembolso</Link>
      </form>}
      </div>}
    </article>;
  })}</div>;
}
