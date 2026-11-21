"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Icon } from "./ui-icon";

type Pedido = { id: number; status: string; criado_em: string; pagamento_id?: string | null };

export function AftercareCenter({ pedidos }: { pedidos: Pedido[] }) {
  const elegiveis = pedidos.filter((pedido) => ["pago", "aprovado", "preparando", "enviado", "entregue"].includes(pedido.status) && !pedido.pagamento_id?.startsWith("TESTE-"));
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function solicitar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pedidoId || enviando) return;
    setEnviando(true);
    setMensagem("");
    try {
      const form = new FormData(event.currentTarget);
      const resposta = await fetch("/api/pos-venda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido_id: pedidoId, codigo_pedido: String(pedidoId).padStart(6, "0"), tipo: form.get("tipo"), motivo: form.get("motivo"), detalhes: form.get("detalhes") }),
      });
      const data = await resposta.json();
      setMensagem(data.mensagem || data.erro || "Não foi possível enviar.");
      if (resposta.ok) setTimeout(() => window.location.reload(), 900);
    } catch {
      setMensagem("Não foi possível enviar. Verifique sua conexão e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return <div className="aftercare-center">
    <div className="aftercare-intro"><span><Icon name="document" /></span><div><h3>Precisa de ajuda com uma compra?</h3><p>Escolha um pedido com pagamento confirmado para solicitar troca, devolução ou reembolso. Acompanhe a resposta logo abaixo.</p></div></div>
    {elegiveis.length ? <>
      <label className="aftercare-order-label" htmlFor="aftercare-order">Pedido relacionado</label>
      <select id="aftercare-order" value={pedidoId ?? ""} onChange={(event) => { setPedidoId(Number(event.target.value) || null); setMensagem(""); }}>
        <option value="">Selecione um pedido</option>
        {elegiveis.map((pedido) => <option value={pedido.id} key={pedido.id}>Pedido #{String(pedido.id).padStart(6, "0")} · {new Date(pedido.criado_em).toLocaleDateString("pt-BR")}</option>)}
      </select>
      {pedidoId && <form className="aftercare-form aftercare-center-form" onSubmit={solicitar}>
        <div className="aftercare-field"><label htmlFor="aftercare-type">O que você precisa?</label><select id="aftercare-type" name="tipo" required><option value="arrependimento">Desistir da compra (direito de arrependimento)</option><option value="troca">Trocar produto</option><option value="devolucao">Devolver produto</option><option value="defeito">Produto com defeito ou avaria</option><option value="reembolso">Solicitar reembolso</option></select></div>
        <div className="aftercare-field"><label htmlFor="aftercare-reason">Motivo</label><input id="aftercare-reason" name="motivo" minLength={5} maxLength={160} required placeholder="Conte resumidamente o motivo" /></div>
        <div className="aftercare-field"><label htmlFor="aftercare-details">Detalhes</label><textarea id="aftercare-details" name="detalhes" maxLength={2000} placeholder="Informe o produto e outras informações importantes" /></div>
        <p>Sua solicitação será analisada pela equipe da Botica. As orientações serão enviadas por e-mail.</p>
        <button type="submit" disabled={enviando}>{enviando ? "ENVIANDO..." : "ENVIAR SOLICITAÇÃO"}</button>
        {mensagem && <strong className="aftercare-message" role="status">{mensagem}</strong>}
      </form>}
    </> : <p className="aftercare-no-orders">Nenhum pedido com pagamento confirmado disponível para uma nova solicitação.</p>}
    <Link href="/politica-de-trocas-e-devolucoes">Consultar a política de trocas, devoluções e reembolso</Link>
  </div>;
}
