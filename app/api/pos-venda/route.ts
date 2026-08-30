import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { enviarEmail, escaparHtml } from "@/lib/email";

const tipos = new Set(["arrependimento", "troca", "devolucao", "defeito", "reembolso"]);

export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ erro: "Entre na conta para solicitar." }, { status: 401 });

  const body = await request.json();
  const pedidoId = Number(body.pedido_id);
  const codigoInformado = String(body.codigo_pedido ?? "").trim().toUpperCase();
  const tipo = String(body.tipo ?? "");
  const motivo = String(body.motivo ?? "").trim().slice(0, 160);
  const detalhes = String(body.detalhes ?? "").trim().slice(0, 2000);
  if (!Number.isInteger(pedidoId) || !tipos.has(tipo) || motivo.length < 5) {
    return NextResponse.json({ erro: "Confira o pedido, o tipo e o motivo da solicitação." }, { status: 400 });
  }

  const { data: pedido } = await supabase.from("pedidos").select("id,total,criado_em").eq("id", pedidoId).eq("usuario_id", auth.user.id).maybeSingle();
  if (!pedido) return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
  const codigoPedido = `BOT-${new Date(pedido.criado_em).getFullYear()}-${String(pedido.id).padStart(6, "0")}`;
  if (codigoInformado !== codigoPedido) {
    return NextResponse.json({ erro: "O código informado não corresponde a este pedido. Confira o código exibido no topo." }, { status: 400 });
  }

  const { data: solicitacao, error } = await supabase.from("solicitacoes_pos_venda").insert({
    pedido_id: pedidoId,
    usuario_id: auth.user.id,
    tipo,
    motivo,
    detalhes: detalhes || null,
  }).select("id,status").single();
  if (error) return NextResponse.json({ erro: "Não foi possível registrar a solicitação." }, { status: 500 });

  const admin = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const nome = auth.user.user_metadata.nome || auth.user.email?.split("@")[0] || "Cliente";
  if (admin) await enviarEmail({
    para: admin,
    assunto: `Nova solicitação em análise — ${codigoPedido}`,
    html: `<h2>Nova solicitação de pós-venda</h2><p><b>Código do pedido:</b> ${codigoPedido}</p><p><b>Pedido interno:</b> #${pedidoId}</p><p><b>Cliente:</b> ${escaparHtml(nome)} (${escaparHtml(auth.user.email)})</p><p><b>Tipo:</b> ${escaparHtml(tipo)}</p><p><b>Motivo:</b> ${escaparHtml(motivo)}</p><p><b>Detalhes:</b> ${escaparHtml(detalhes || "Não informado")}</p><p>Acesse o painel administrativo da Botica para analisar.</p>`,
  });
  if (auth.user.email) await enviarEmail({
    para: auth.user.email,
    assunto: `Recebemos sua solicitação — ${codigoPedido}`,
    html: `<h2>Solicitação recebida</h2><p>Olá, ${escaparHtml(nome)}. Sua solicitação referente ao pedido <b>${codigoPedido}</b> foi registrada e está <b>em análise</b>.</p><p>Protocolo: #${solicitacao.id}. A Botica enviará as próximas orientações por e-mail e pela área “Minha conta”.</p>`,
  });

  return NextResponse.json({ mensagem: "Solicitação enviada e colocada em análise.", solicitacao });
}
