import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { enviarEmail, escaparHtml } from "@/lib/email";

async function adminAutenticado() {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: perfil } = await supabase.from("perfis").select("funcao").eq("id", auth.user.id).maybeSingle();
  return perfil?.funcao === "admin" ? criarClienteAdmin() : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await adminAutenticado();
  if (!admin) return NextResponse.json({ erro: "Acesso restrito." }, { status: 403 });
  const id = Number((await params).id);
  const { data: receita } = await admin.from("receitas").select("arquivo_url").eq("id", id).maybeSingle();
  if (!receita) return NextResponse.json({ erro: "Receita não encontrada." }, { status: 404 });
  const { data, error } = await admin.storage.from("receitas-privadas").createSignedUrl(receita.arquivo_url, 300);
  if (error) return NextResponse.json({ erro: "Não foi possível abrir o arquivo." }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await adminAutenticado();
  if (!admin) return NextResponse.json({ erro: "Acesso restrito." }, { status: 403 });
  const id = Number((await params).id); const body = await request.json();
  const status = String(body.status ?? "");
  const mensagem = String(body.mensagem ?? "").trim();
  const permitidos = new Set(["em_analise", "orcamento_enviado", "aprovada", "recusada"]);
  if (!permitidos.has(status)) return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
  if (!mensagem) return NextResponse.json({ erro: "Escreva uma mensagem para o cliente." }, { status: 400 });
  const { data: receita, error } = await admin.from("receitas").update({ status, resposta_admin: mensagem }).eq("id", id).select("id,usuario_id,status,resposta_admin").single();
  if (error) return NextResponse.json({ erro: "Não foi possível atualizar." }, { status: 500 });
  const { data: usuario } = await admin.auth.admin.getUserById(receita.usuario_id);
  if (!usuario.user?.email) return NextResponse.json({ mensagem: "Resposta salva, mas o cliente não possui e-mail cadastrado.", enviado: false });
  const envio = await enviarEmail({
    para: usuario.user.email,
    assunto: `Resposta sobre sua receita #${id}`,
    html: `<h2>Resposta da Botica Bioenergética</h2><p>Olá! Sua receita foi atualizada para: <b>${escaparHtml(status.replaceAll("_", " "))}</b>.</p><div style="margin:20px 0;padding:16px;border-left:4px solid #14503c;background:#f2f6f3"><b>Mensagem da Botica:</b><br>${escaparHtml(mensagem).replaceAll("\n", "<br>")}</div><p>Acesse sua conta na loja caso precise consultar outras informações.</p>`,
  });
  if (!envio.enviado) return NextResponse.json({ mensagem: envio.motivo === "EMAIL_NAO_CONFIGURADO" ? "Resposta salva, mas o envio de e-mail ainda não está configurado no servidor." : "Resposta salva, mas o serviço de e-mail não conseguiu realizar o envio.", enviado: false });
  return NextResponse.json({ mensagem: `Resposta salva e enviada para ${usuario.user.email}.`, enviado: true });
}
