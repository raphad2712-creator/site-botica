"use client";

type Solicitacao = { id: number; pedido_id: number; tipo: string; status: string; motivo: string; resposta_admin?: string | null; criado_em: string };
type Pedido = { id: number; criado_em: string };

const statusRotulo: Record<string, string> = {
  em_analise: "Em análise", aprovada: "Aprovada", recusada: "Recusada",
  aguardando_envio: "Aguardando envio", produto_recebido: "Produto recebido",
  reembolso_processado: "Reembolso processado", concluida: "Concluída",
};

export function CustomerRequests({ solicitacoes, pedidos }: { solicitacoes: Solicitacao[]; pedidos: Pedido[] }) {
  if (!solicitacoes.length) return <div className="customer-requests-empty"><span>◎</span><h3>Nenhuma solicitação enviada</h3><p>Quando você solicitar uma troca, devolução ou reembolso, o acompanhamento aparecerá aqui.</p><a href="#pedidos">VER MEUS PEDIDOS</a></div>;

  return <div className="customer-request-list">{solicitacoes.map((item) => {
    const pedido = pedidos.find((registro) => registro.id === item.pedido_id);
    const ano = pedido ? new Date(pedido.criado_em).getFullYear() : new Date(item.criado_em).getFullYear();
    const codigo = `BOT-${ano}-${String(item.pedido_id).padStart(6, "0")}`;
    return <article key={item.id}>
      <header><div><small>PROTOCOLO #{item.id}</small><h3>{codigo}</h3></div><strong className={`request-status request-${item.status}`}>{statusRotulo[item.status] || item.status.replaceAll("_", " ")}</strong></header>
      <div className="customer-request-body"><span><small>TIPO</small>{item.tipo.replaceAll("_", " ")}</span><span><small>ENVIADA EM</small>{new Date(item.criado_em).toLocaleDateString("pt-BR")}</span><div><small>MOTIVO</small><b>{item.motivo}</b></div>{item.resposta_admin && <p><small>RESPOSTA DA BOTICA</small>{item.resposta_admin}</p>}</div>
    </article>;
  })}</div>;
}
