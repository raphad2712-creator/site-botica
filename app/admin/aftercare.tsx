"use client";

import { FormEvent, useState } from "react";

type PedidoAdmin = { id: number; status: string; status_entrega?: string | null; transportadora?: string | null; codigo_rastreio?: string | null; link_rastreio?: string | null; criado_em: string };
type SolicitacaoAdmin = { id: number; pedido_id: number; tipo: string; motivo: string; detalhes?: string | null; status: string; resposta_admin?: string | null; criado_em: string };

export function AdminAftercare({ pedidos, solicitacoes }: { pedidos: PedidoAdmin[]; solicitacoes: SolicitacaoAdmin[] }) {
  const [mensagem, setMensagem] = useState("");

  async function salvarRastreio(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const resposta = await fetch(`/api/admin/pedidos/${id}/rastreio`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    const data = await resposta.json(); setMensagem(data.mensagem || data.erro); if (resposta.ok) setTimeout(() => location.reload(), 700);
  }
  async function analisar(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const resposta = await fetch(`/api/admin/pos-venda/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    const data = await resposta.json(); setMensagem(data.mensagem || data.erro); if (resposta.ok) setTimeout(() => location.reload(), 700);
  }

  return <div className="admin-aftercare">
    <p className="form-message">{mensagem}</p>
    <section><div className="admin-section-title"><small>LOGÍSTICA</small><h2>Rastreamento dos pedidos</h2><p>Enquanto a transportadora não está integrada, cadastre aqui o código e atualize a etapa.</p></div>
      <div className="admin-cards">{pedidos.map((pedido) => <form key={pedido.id} onSubmit={(e) => salvarRastreio(e, pedido.id)}><h3>Pedido #{pedido.id}</h3><small>{new Date(pedido.criado_em).toLocaleDateString("pt-BR")}</small><input name="transportadora" defaultValue={pedido.transportadora || ""} placeholder="Transportadora" /><input name="codigo_rastreio" defaultValue={pedido.codigo_rastreio || ""} placeholder="Código de rastreamento" /><input name="link_rastreio" type="url" defaultValue={pedido.link_rastreio || ""} placeholder="Link de rastreamento" /><select name="status_entrega" defaultValue={pedido.status_entrega || "preparando"}><option value="preparando">Em preparação</option><option value="postado">Postado</option><option value="em_transito">Em trânsito</option><option value="saiu_para_entrega">Saiu para entrega</option><option value="entregue">Entregue</option><option value="atrasado">Atrasado</option></select><button>ATUALIZAR E AVISAR CLIENTE</button></form>)}</div>
    </section>
    <section><div className="admin-section-title"><small>PÓS-VENDA</small><h2>Solicitações em análise</h2><p>Analise o pedido antes de autorizar a devolução ou processar qualquer reembolso.</p></div>
      <div className="admin-cards">{solicitacoes.length ? solicitacoes.map((item) => <form key={item.id} onSubmit={(e) => analisar(e, item.id)}><h3>Solicitação #{item.id}</h3><small>Pedido #{item.pedido_id} • {item.tipo.replaceAll("_", " ")}</small><p><b>{item.motivo}</b><br />{item.detalhes}</p><select name="status" defaultValue={item.status}><option value="em_analise">Em análise</option><option value="aprovada">Aprovada</option><option value="recusada">Recusada</option><option value="aguardando_envio">Aguardando envio do produto</option><option value="produto_recebido">Produto recebido</option><option value="reembolso_processado">Reembolso processado</option><option value="concluida">Concluída</option></select><textarea name="resposta_admin" defaultValue={item.resposta_admin || ""} placeholder="Orientação que será enviada ao cliente" /><button>ATUALIZAR E AVISAR CLIENTE</button></form>) : <div className="admin-none">Nenhuma solicitação recebida.</div>}</div>
    </section>
  </div>;
}
