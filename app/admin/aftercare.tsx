"use client";

import { FormEvent, useState } from "react";

type PedidoAdmin = {
  id: number; total: number; status: string; status_entrega?: string | null; transportadora?: string | null; codigo_rastreio?: string | null; link_rastreio?: string | null; criado_em: string;
  cliente?: { nome?: string | null; email?: string | null; cpf?: string | null; telefone?: string | null };
  endereco?: { cep?: string | null; rua?: string | null; numero?: string | null; complemento?: string | null; bairro?: string | null; cidade?: string | null; estado?: string | null } | null;
};
type SolicitacaoAdmin = { id: number; pedido_id: number; tipo: string; motivo: string; detalhes?: string | null; status: string; resposta_admin?: string | null; criado_em: string };
type ReceitaAprovada = { id: number; status_entrega?: string | null; transportadora?: string | null; codigo_rastreio?: string | null; link_rastreio?: string | null; criado_em: string; cliente?: { nome?: string | null; email?: string | null; cpf?: string | null; telefone?: string | null; cep?: string | null; rua?: string | null; numero?: string | null; complemento?: string | null; bairro?: string | null; cidade?: string | null; estado?: string | null } };

export function AdminAftercare({ pedidos, solicitacoes, receitasAprovadas }: { pedidos: PedidoAdmin[]; solicitacoes: SolicitacaoAdmin[]; receitasAprovadas: ReceitaAprovada[] }) {
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState<string | null>(null);
  const solicitacoesPendentes = solicitacoes.filter((item) => item.status !== "concluida");
  const solicitacoesConcluidas = solicitacoes.filter((item) => item.status === "concluida");

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
  async function salvarRastreioReceita(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault(); setSalvando(`receita-${id}`); setMensagem(""); const form = new FormData(event.currentTarget);
    const resposta = await fetch(`/api/admin/receitas/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "rastreio", ...Object.fromEntries(form) }) });
    const data = await resposta.json(); setMensagem(data.mensagem || data.erro); setSalvando(null); if (resposta.ok) setTimeout(() => location.reload(), 800);
  }

  return <div className="admin-aftercare">
    {mensagem && <p className="admin-toast" role="status">{mensagem}</p>}
    <section id="entregas-admin"><div className="admin-panel-heading"><div><small>LOGÍSTICA</small><h2>Entregas e rastreamento</h2><p>Escolha a etapa, informe o código e o cliente receberá a atualização por e-mail.</p></div><span>{pedidos.length} PEDIDOS</span></div>
      <div className="admin-cards admin-delivery-cards">{pedidos.length ? pedidos.map((pedido) => { const codigo = `BOT-${new Date(pedido.criado_em).getFullYear()}-${String(pedido.id).padStart(6, "0")}`; return <form key={pedido.id} onSubmit={(e) => salvarRastreio(e, pedido.id)}>
        <header><div><small>CÓDIGO DO PEDIDO</small><h3>{codigo}</h3></div><span className={`delivery-badge delivery-${pedido.status_entrega || "preparando"}`}>{(pedido.status_entrega || "preparando").replaceAll("_", " ")}</span></header>
        <div className="admin-order-meta"><span><small>DATA</small>{new Date(pedido.criado_em).toLocaleDateString("pt-BR")}</span><span><small>TOTAL</small>{Number(pedido.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span><span><small>PAGAMENTO</small>{pedido.status.replaceAll("_", " ")}</span></div>
        <details className="admin-customer-details">
          <summary><span>♙</span><b>Dados do comprador e entrega</b><small>CLIQUE PARA VER</small></summary>
          <div className="admin-customer-grid">
            <section><small>COMPRADOR</small><b>{pedido.cliente?.nome || "Nome não informado"}</b><a href={pedido.cliente?.email ? `mailto:${pedido.cliente.email}` : undefined}>{pedido.cliente?.email || "E-mail não encontrado"}</a>{pedido.cliente?.telefone && <a href={`tel:${pedido.cliente.telefone}`}>{pedido.cliente.telefone}</a>}{pedido.cliente?.cpf && <span>CPF: {pedido.cliente.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</span>}</section>
            <section><small>ENDEREÇO DE ENTREGA</small>{pedido.endereco ? <><b>{pedido.endereco.rua}, {pedido.endereco.numero}</b>{pedido.endereco.complemento && <span>{pedido.endereco.complemento}</span>}<span>{pedido.endereco.bairro} — {pedido.endereco.cidade}/{pedido.endereco.estado}</span><span>CEP: {String(pedido.endereco.cep || "").replace(/(\d{5})(\d{3})/, "$1-$2")}</span></> : <span>Endereço não encontrado para este pedido.</span>}</section>
          </div>
        </details>
        <label>Etapa atual<select name="status_entrega" defaultValue={pedido.status_entrega || "preparando"}><option value="preparando">1. Em preparação</option><option value="postado">2. Postado</option><option value="em_transito">3. Em trânsito</option><option value="saiu_para_entrega">4. Saiu para entrega</option><option value="entregue">5. Entregue</option><option value="atrasado">Atrasado</option></select></label>
        <div className="admin-form-grid"><label>Transportadora<input name="transportadora" defaultValue={pedido.transportadora || ""} placeholder="Ex.: Correios" /></label><label>Código de rastreamento<input name="codigo_rastreio" defaultValue={pedido.codigo_rastreio || ""} placeholder="Ex.: AA123456789BR" /></label></div>
        <label>Link para acompanhar<input name="link_rastreio" type="url" defaultValue={pedido.link_rastreio || ""} placeholder="https://..." /></label>
        <div className="admin-email-note"><span>✉</span><p><b>Notificação automática</b><br />Ao salvar, o comprador receberá a nova etapa e o código no e-mail cadastrado.</p></div>
        <button disabled={salvando === `pedido-${pedido.id}`}>{salvando === `pedido-${pedido.id}` ? "SALVANDO..." : "SALVAR E AVISAR CLIENTE"}</button>
      </form>; }) : <div className="admin-none">Nenhum pedido encontrado.</div>}</div>
      <div className="admin-panel-heading admin-approved-heading"><div><small>MANIPULAÇÃO APROVADA</small><h2>Receitas em preparação e entrega</h2><p>As receitas aprovadas aparecem aqui para você organizar o envio e avisar o cliente.</p></div><span>{receitasAprovadas.length} RECEITAS</span></div>
      <div className="admin-cards admin-delivery-cards admin-approved-deliveries">{receitasAprovadas.length ? receitasAprovadas.map((receita) => <form key={receita.id} onSubmit={(e) => salvarRastreioReceita(e, receita.id)}>
        <header><div><small>CÓDIGO DA RECEITA</small><h3>RCT-{new Date(receita.criado_em).getFullYear()}-{String(receita.id).padStart(6, "0")}</h3></div><span className={`delivery-badge delivery-${receita.status_entrega || "preparando"}`}>{(receita.status_entrega || "preparando").replaceAll("_", " ")}</span></header>
        <details className="admin-customer-details"><summary><span>♙</span><b>Dados do cliente e entrega</b><small>CLIQUE PARA VER</small></summary><div className="admin-customer-grid"><section><small>CLIENTE</small><b>{receita.cliente?.nome || "Nome não informado"}</b><a href={receita.cliente?.email ? `mailto:${receita.cliente.email}` : undefined}>{receita.cliente?.email || "E-mail não encontrado"}</a>{receita.cliente?.telefone && <a href={`tel:${receita.cliente.telefone}`}>{receita.cliente.telefone}</a>}</section><section><small>ENDEREÇO DE ENTREGA</small><b>{receita.cliente?.rua}, {receita.cliente?.numero}</b>{receita.cliente?.complemento && <span>{receita.cliente.complemento}</span>}<span>{receita.cliente?.bairro} — {receita.cliente?.cidade}/{receita.cliente?.estado}</span><span>CEP: {String(receita.cliente?.cep || "").replace(/(\d{5})(\d{3})/, "$1-$2")}</span></section></div></details>
        <label>Etapa atual<select name="status_entrega" defaultValue={receita.status_entrega || "preparando"}><option value="preparando">1. Em preparação</option><option value="postado">2. Postado</option><option value="em_transito">3. Em trânsito</option><option value="saiu_para_entrega">4. Saiu para entrega</option><option value="entregue">5. Entregue</option><option value="atrasado">Atrasado</option></select></label>
        <div className="admin-form-grid"><label>Transportadora<input name="transportadora" defaultValue={receita.transportadora || ""} placeholder="Ex.: Correios" /></label><label>Código de rastreamento<input name="codigo_rastreio" defaultValue={receita.codigo_rastreio || ""} placeholder="Ex.: AA123456789BR" /></label></div>
        <label>Link para acompanhar<input name="link_rastreio" type="url" defaultValue={receita.link_rastreio || ""} placeholder="https://..." /></label><div className="admin-email-note"><span>✉</span><p><b>Notificação automática</b><br />Ao salvar, o cliente receberá a nova etapa e o rastreamento por e-mail.</p></div><button disabled={salvando === `receita-${receita.id}`}>{salvando === `receita-${receita.id}` ? "SALVANDO..." : "SALVAR E AVISAR CLIENTE"}</button>
      </form>) : <div className="admin-none">Nenhuma receita aprovada aguardando entrega.</div>}</div>
    </section>
    <section id="pos-venda-admin"><div className="admin-panel-heading"><div><small>PÓS-VENDA</small><h2>Solicitações pendentes</h2><p>Aqui ficam somente os atendimentos que ainda precisam de análise ou alguma ação.</p></div><span>{solicitacoesPendentes.length} PENDENTES</span></div>
      <div className="admin-cards admin-refund-cards">{solicitacoesPendentes.length ? solicitacoesPendentes.map((item) => <form key={item.id} onSubmit={(e) => analisar(e, item.id)}><header><div><small>PROTOCOLO</small><h3>Solicitação #{item.id}</h3></div><span className={`refund-badge refund-${item.status}`}>{item.status.replaceAll("_", " ")}</span></header><div className="refund-order-code">Pedido BOT-{new Date(item.criado_em).getFullYear()}-{String(item.pedido_id).padStart(6, "0")} • {item.tipo.replaceAll("_", " ")}</div><div className="refund-reason"><small>MOTIVO INFORMADO</small><b>{item.motivo}</b><p>{item.detalhes || "Nenhum detalhe adicional."}</p></div><label>Decisão da análise<select name="status" defaultValue={item.status}><option value="em_analise">Em análise</option><option value="aprovada">Aprovada</option><option value="recusada">Recusada</option><option value="aguardando_envio">Aguardando envio do produto</option><option value="produto_recebido">Produto recebido</option><option value="reembolso_processado">Reembolso processado</option><option value="concluida">Concluída</option></select></label><label>Mensagem para o cliente<textarea name="resposta_admin" defaultValue={item.resposta_admin || ""} placeholder="Explique a decisão e informe os próximos passos" /></label><button disabled={salvando === `solicitacao-${item.id}`}>{salvando === `solicitacao-${item.id}` ? "SALVANDO..." : "SALVAR E AVISAR CLIENTE"}</button></form>) : <div className="admin-none">Nenhuma solicitação pendente. Está tudo em dia!</div>}</div>
    </section>
    <section id="historico-admin" className="admin-completed-section"><div className="admin-panel-heading"><div><small>HISTÓRICO</small><h2>Solicitações concluídas</h2><p>Atendimentos finalizados ficam arquivados aqui para consulta.</p></div><span>{solicitacoesConcluidas.length} CONCLUÍDAS</span></div>
      <div className="admin-completed-list">{solicitacoesConcluidas.length ? solicitacoesConcluidas.map((item) => <article key={item.id}><div className="completed-icon">✓</div><div className="completed-main"><small>PROTOCOLO #{item.id}</small><h3>Pedido BOT-{new Date(item.criado_em).getFullYear()}-{String(item.pedido_id).padStart(6, "0")}</h3><p><b>{item.tipo.replaceAll("_", " ")}</b> • {item.motivo}</p>{item.resposta_admin && <blockquote>{item.resposta_admin}</blockquote>}</div><div className="completed-meta"><strong>CONCLUÍDA</strong><span>{new Date(item.criado_em).toLocaleDateString("pt-BR")}</span></div></article>) : <div className="admin-none">Ainda não existem solicitações concluídas.</div>}</div>
    </section>
  </div>;
}
