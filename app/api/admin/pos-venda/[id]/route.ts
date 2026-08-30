import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { enviarEmail, escaparHtml } from "@/lib/email";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const { data: perfil } = await supabase.from("perfis").select("funcao").eq("id", auth.user.id).maybeSingle();
  if (perfil?.funcao !== "admin") return NextResponse.json({ erro: "Acesso restrito." }, { status: 403 });

  const id = Number((await params).id);
  const body = await request.json();
  const permitidos = new Set(["em_analise", "aprovada", "recusada", "aguardando_envio", "produto_recebido", "reembolso_processado", "concluida"]);
  const status = String(body.status ?? "");
  if (!Number.isInteger(id) || !permitidos.has(status)) return NextResponse.json({ erro: "Status inválido." }, { status: 400 });

  const admin = criarClienteAdmin();
  const { data: solicitacao, error } = await admin.from("solicitacoes_pos_venda").update({
    status,
    resposta_admin: String(body.resposta_admin ?? "").trim() || null,
    atualizado_em: new Date().toISOString(),
  }).eq("id", id).select("id,pedido_id,usuario_id,status,resposta_admin").single();
  if (error) return NextResponse.json({ erro: "Não foi possível atualizar a solicitação." }, { status: 500 });

  const { data: usuario } = await admin.auth.admin.getUserById(solicitacao.usuario_id);
  if (usuario.user?.email) await enviarEmail({
    para: usuario.user.email,
    assunto: `Atualização da solicitação #${id}`,
    html: `<h2>Sua solicitação foi atualizada</h2><p>Pedido #${solicitacao.pedido_id}</p><p>Novo status: <b>${escaparHtml(status.replaceAll("_", " "))}</b></p><p>${escaparHtml(solicitacao.resposta_admin || "Consulte a área Minha conta para acompanhar.")}</p>`,
  });
  return NextResponse.json({ mensagem: "Solicitação atualizada.", solicitacao });
}
