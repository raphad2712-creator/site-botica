"use client";

import { FormEvent, useState } from "react";

type PedidoAdmin = { id: number; total: number; status: string; status_entrega?: string | null; transportadora?: string | null; codigo_rastreio?: string | null; link_rastreio?: string | null; criado_em: string };
type SolicitacaoAdmin = { id: number; pedido_id: number; tipo: string; motivo: string; detalhes?: string | null; status: string; resposta_admin?: string | null; criado_em: string };

export function AdminAftercare({ pedidos, solicitacoes }: { pedidos: PedidoAdmin[]; solicitacoes: SolicitacaoAdmin[] }) {
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState<string | null>(null);

  async function salvarRastreio(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault(); setSalvando(`pedido-${id}`); setMensagem(""); const form = new FormData(event.currentTarget);
    const resposta = await fetch(`/api/admin/pedidos/${id}/rastreio`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    const data = await resposta.json(); setMensagem(data.mensagem || data.erro); setSalvando(null); if (resposta.ok) setTimeout(() => location.reload(), 700);
  }
  async function analisar(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault(); setSalvando(`solicitacao-${id}`); setMensagem(""); const form = new FormData(event.currentTarget);
    const resposta = await fetch(`/api/admin/pos-venda/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    const data = await resposta.json(); setMensagem(data.mensagem || data.erro); setSalvando(null); if (resposta.ok) setTimeout(() => location.reload(), 700);
  }

  return <div className="admin-aftercare">
    {mensagem && <p className="admin-toast" role="status">{mensagem}</p>}
    <section id="entregas-admin"><div className="admin-panel-heading"><div><small>LOGÍSTICA</small><h2>Entregas e rastreamento</h2><p>Escolha a etapa, informe o código e o cliente receberá a atualização por e-mail.</p></div><span>{pedidos.length} PEDIDOS</span></div>
      <div className="admin-cards admin-delivery-cards">{pedidos.length ? pedidos.map((pedido) => { const codigo = `BOT-${new Date(pedido.criado_em).getFullYear()}-${String(pedido.id).padStart(6, "0")}`; return <form key={pedido.id} onSubmit={(e) => salvarRastreio(e, pedido.id)}>
        <header><div><small>CÓDIGO DO PEDIDO</small><h3>{codigo}</h3></div><span className={`delivery-badge delivery-${pedido.status_entrega || "preparando"}`}>{(pedido.status_entrega || "preparando").replaceAll("_", " ")}</span></header>
        <div className="admin-order-meta"><span><small>DATA</small>{new Date(pedido.criado_em).toLocaleDateString("pt-BR")}</span><span><small>TOTAL</small>{Number(pedido.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span><span><small>PAGAMENTO</small>{pedido.status.replaceAll("_", " ")}</span></div>
        <label>Etapa atual<select name="status_entrega" defaultValue={pedido.status_entrega || "preparando"}><option value="preparando">1. Em preparação</option><option value="postado">2. Postado</option><option value="em_transito">3. Em trânsito</option><option value="saiu_para_entrega">4. Saiu para entrega</option><option value="entregue">5. Entregue</option><option value="atrasado">Atrasado</option></select></label>
        <div className="admin-form-grid"><label>Transportadora<input name="transportadora" defaultValue={pedido.transportadora || ""} placeholder="Ex.: Correios" /></label><label>Código de rastreamento<input name="codigo_rastreio" defaultValue={pedido.codigo_rastreio || ""} placeholder="Ex.: AA123456789BR" /></label></div>
        <label>Link para acompanhar<input name="link_rastreio" type="url" defaultValue={pedido.link_rastreio || ""} placeholder="https://..." /></label>
        <div className="admin-email-note"><span>✉</span><p><b>Notificação automática</b><br />Ao salvar, o comprador receberá a nova etapa e o código no e-mail cadastrado.</p></div>
        <button disabled={salvando === `pedido-${pedido.id}`}>{salvando === `pedido-${pedido.id}` ? "SALVANDO..." : "SALVAR E AVISAR CLIENTE"}</button>
      </form>; }) : <div className="admin-none">Nenhum pedido encontrado.</div>}</div>
    </section>
    <section id="pos-venda-admin"><div className="admin-panel-heading"><div><small>PÓS-VENDA</small><h2>Trocas e reembolsos</h2><p>Analise cada solicitação e envie a orientação diretamente para o e-mail do cliente.</p></div><span>{solicitacoes.filter((item) => item.status === "em_analise").length} EM ANÁLISE</span></div>
      <div className="admin-cards admin-refund-cards">{solicitacoes.length ? solicitacoes.map((item) => <form key={item.id} onSubmit={(e) => analisar(e, item.id)}><header><div><small>PROTOCOLO</small><h3>Solicitação #{item.id}</h3></div><span className={`refund-badge refund-${item.status}`}>{item.status.replaceAll("_", " ")}</span></header><div className="refund-order-code">Pedido BOT-{new Date(item.criado_em).getFullYear()}-{String(item.pedido_id).padStart(6, "0")} • {item.tipo.replaceAll("_", " ")}</div><div className="refund-reason"><small>MOTIVO INFORMADO</small><b>{item.motivo}</b><p>{item.detalhes || "Nenhum detalhe adicional."}</p></div><label>Decisão da análise<select name="status" defaultValue={item.status}><option value="em_analise">Em análise</option><option value="aprovada">Aprovada</option><option value="recusada">Recusada</option><option value="aguardando_envio">Aguardando envio do produto</option><option value="produto_recebido">Produto recebido</option><option value="reembolso_processado">Reembolso processado</option><option value="concluida">Concluída</option></select></label><label>Mensagem para o cliente<textarea name="resposta_admin" defaultValue={item.resposta_admin || ""} placeholder="Explique a decisão e informe os próximos passos" /></label><button disabled={salvando === `solicitacao-${item.id}`}>{salvando === `solicitacao-${item.id}` ? "SALVANDO..." : "SALVAR E AVISAR CLIENTE"}</button></form>) : <div className="admin-none">Nenhuma solicitação recebida.</div>}</div>
    </section>
  </div>;
}
