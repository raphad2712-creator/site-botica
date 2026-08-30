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
  const permitidos = new Set(["preparando", "postado", "em_transito", "saiu_para_entrega", "entregue", "atrasado"]);
  const status = String(body.status_entrega ?? "preparando");
  if (!Number.isInteger(id) || !permitidos.has(status)) return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });

  const admin = criarClienteAdmin();
  const alteracao = {
    transportadora: String(body.transportadora ?? "").trim() || null,
    codigo_rastreio: String(body.codigo_rastreio ?? "").trim() || null,
    link_rastreio: String(body.link_rastreio ?? "").trim() || null,
    status_entrega: status,
    rastreio_atualizado_em: new Date().toISOString(),
    entregue_em: status === "entregue" ? new Date().toISOString() : null,
  };
  const { data: pedido, error } = await admin.from("pedidos").update(alteracao).eq("id", id).select("id,usuario_id,codigo_rastreio,link_rastreio,status_entrega").single();
  if (error) return NextResponse.json({ erro: "Não foi possível atualizar o rastreio." }, { status: 500 });

  const { data: usuario } = await admin.auth.admin.getUserById(pedido.usuario_id);
  if (usuario.user?.email) await enviarEmail({
    para: usuario.user.email,
    assunto: `Atualização da entrega — pedido #${id}`,
    html: `<h2>Seu pedido foi atualizado</h2><p>O pedido #${id} agora está com o status <b>${escaparHtml(status.replaceAll("_", " "))}</b>.</p>${pedido.codigo_rastreio ? `<p>Código de rastreamento: <b>${escaparHtml(pedido.codigo_rastreio)}</b></p>` : ""}${pedido.link_rastreio ? `<p><a href="${escaparHtml(pedido.link_rastreio)}">Acompanhar entrega</a></p>` : ""}`,
  });
  return NextResponse.json({ mensagem: "Rastreamento atualizado.", pedido });
}
