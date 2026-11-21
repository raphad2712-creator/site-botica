"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./ui-icon";
import { ProductImage } from "./product-image";

type Pedido = {
  id: number; total: number; status: string; pagamento_id?: string | null; criado_em: string;
  transportadora?: string | null; codigo_rastreio?: string | null; link_rastreio?: string | null;
  status_entrega?: string | null; rastreio_atualizado_em?: string | null;
  itens_pedido?: Array<{ quantidade: number; preco_unitario: number; produto?: { id: number; nome: string; imagem_url?: string | null; categoria?: string | null } | Array<{ id: number; nome: string; imagem_url?: string | null; categoria?: string | null }> | null }>;
};

const etapas = ["preparando", "postado", "em_transito", "saiu_para_entrega", "entregue"];
const rotulos: Record<string, string> = { preparando: "Em preparação", postado: "Postado", em_transito: "Em trânsito", saiu_para_entrega: "Saiu para entrega", entregue: "Entregue", atrasado: "Entrega atrasada" };

export function OrderAftercare({ pedidos }: { pedidos: Pedido[] }) {
  const [detalhesAbertos, setDetalhesAbertos] = useState<number | null>(null);

  const pedidosComProdutos = pedidos.filter((pedido) => pedido.itens_pedido?.length);
  if (!pedidosComProdutos.length) return <div className="account-empty"><span><Icon name="document" /></span><h3>Você ainda não finalizou nenhum pedido</h3><p>Depois de concluir o checkout, sua compra aparecerá aqui com produtos, código e acompanhamento.</p><Link href="/#produtos">VER PRODUTOS</Link></div>;

  return <div className="account-orders order-list-modern">{pedidosComProdutos.map((pedido) => {
    const indice = Math.max(0, etapas.indexOf(pedido.status_entrega || "preparando"));
    const codigoPedido = String(pedido.id).padStart(6, "0");
    const teste = pedido.pagamento_id?.startsWith("TESTE-") === true;
    return <article className="order-card" key={pedido.id}>
      <header className="order-card-header"><div><small>{teste ? "PEDIDO REGISTRADO — PAGAMENTO PENDENTE" : "CÓDIGO DO PEDIDO"}</small><h3>{codigoPedido}</h3></div><span>{teste ? "Aguardando orientação da Botica" : rotulos[pedido.status_entrega || "preparando"] || "Em preparação"}</span></header>
      <div className="order-summary-row">
        <div className="order-number"><small>PEDIDO</small><b>#{pedido.id}</b></div>
        <div><small>DATA</small><span>{new Date(pedido.criado_em).toLocaleDateString("pt-BR")}</span></div>
        <div><small>PAGAMENTO</small><span className={`order-status status-${pedido.status}`}>{teste ? "Pagamento não realizado" : pedido.status.replaceAll("_", " ")}</span></div>
        <div className="order-total"><small>TOTAL</small><strong>{Number(pedido.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div>
      </div>
      <div className="order-card-actions">
        <button className="order-details-toggle" type="button" aria-expanded={detalhesAbertos === pedido.id} aria-controls={`order-details-${pedido.id}`} onClick={() => setDetalhesAbertos(detalhesAbertos === pedido.id ? null : pedido.id)}><span>{detalhesAbertos === pedido.id ? "Ocultar detalhes" : "Ver detalhes e entrega"}</span><b>{detalhesAbertos === pedido.id ? "−" : "+"}</b></button>
      </div>
      {detalhesAbertos === pedido.id && <div className="order-expanded-content" id={`order-details-${pedido.id}`}>
      <div className="order-products"><h4>Produtos deste pedido</h4>{pedido.itens_pedido?.map((item, indice) => { const produto = Array.isArray(item.produto) ? item.produto[0] : item.produto; return <div className="order-product" key={`${produto?.id || 0}-${indice}`}><div className="order-product-image"><ProductImage nome={produto?.nome || "Produto Botica"} imagemAtual={produto?.imagem_url} /></div><div><b>{produto?.nome || "Produto"}</b><small>{produto?.categoria || "Produto Botica"}</small><span>Quantidade: {item.quantidade}</span></div><strong>{(Number(item.preco_unitario) * item.quantidade).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div>; })}</div>
      <div className="tracking-box">
        <div className="tracking-head"><div><small>ACOMPANHAMENTO DA ENTREGA</small><h3>{rotulos[pedido.status_entrega || "preparando"] || "Em preparação"}</h3></div>{pedido.codigo_rastreio && <button type="button" onClick={() => navigator.clipboard.writeText(pedido.codigo_rastreio!)}><Icon name="document" />Copiar código</button>}</div>
        <div className="tracking-steps">{etapas.map((etapa, i) => <div className={i <= indice && pedido.status_entrega !== "atrasado" ? "done" : ""} key={etapa}><i>{i < indice ? <Icon name="check" /> : <b>{i + 1}</b>}</i><span>{rotulos[etapa]}</span></div>)}</div>
        <div className="tracking-details"><span><small>TRANSPORTADORA</small>{pedido.transportadora || "Será informada após a postagem"}</span><span><small>CÓDIGO</small>{pedido.codigo_rastreio || "Aguardando postagem"}</span>{pedido.link_rastreio && <a href={pedido.link_rastreio} target="_blank" rel="noreferrer">ACOMPANHAR NO SITE DA TRANSPORTADORA <Icon name="arrow-up-right" /></a>}</div>
      </div>
      </div>}
    </article>;
  })}</div>;
}
