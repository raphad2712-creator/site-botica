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
  const status = String(body.status ?? ""); const permitidos = new Set(["em_analise", "orcamento_enviado", "aprovada", "recusada"]);
  if (!permitidos.has(status)) return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
  const { data: receita, error } = await admin.from("receitas").update({ status }).eq("id", id).select("id,usuario_id,status").single();
  if (error) return NextResponse.json({ erro: "Não foi possível atualizar." }, { status: 500 });
  const { data: usuario } = await admin.auth.admin.getUserById(receita.usuario_id);
  if (usuario.user?.email) await enviarEmail({ para: usuario.user.email, assunto: `Atualização da receita #${id}`, html: `<h2>Sua receita foi atualizada</h2><p>Novo status: <b>${escaparHtml(status.replaceAll("_", " "))}</b>.</p><p>A equipe da Botica entrará em contato quando necessário.</p>` });
  return NextResponse.json({ mensagem: "Receita atualizada e cliente avisado." });
}
