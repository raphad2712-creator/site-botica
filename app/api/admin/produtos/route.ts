import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

async function autenticarAdmin() {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { erro: NextResponse.json({ erro: "Faça login como administrador." }, { status: 401 }) };
  const { data: perfil } = await supabase.from("perfis").select("funcao").eq("id", auth.user.id).maybeSingle();
  if (perfil?.funcao !== "admin") return { erro: NextResponse.json({ erro: "Sua conta não possui acesso administrativo." }, { status: 403 }) };
  return { admin: criarClienteAdmin() };
}

export async function POST(request: Request) {
  try {
    const autenticacao = await autenticarAdmin();
    if (autenticacao.erro) return autenticacao.erro;
    const body = await request.json();
  const nome = String(body.nome ?? "").trim();
  const descricao = String(body.descricao ?? "").trim();
  const categoria = String(body.categoria ?? "").trim();
  const preco = Number(body.preco);
  const estoque = Number(body.estoque);
  const precoAntigo = body.preco_antigo === null || body.preco_antigo === "" ? null : Number(body.preco_antigo);
  const imagemUrl = String(body.imagem_url ?? "").trim() || null;
  if (!nome || !descricao || !categoria || !Number.isFinite(preco) || preco <= 0 || !Number.isInteger(estoque) || estoque < 0 || (precoAntigo !== null && (!Number.isFinite(precoAntigo) || precoAntigo <= 0))) {
    return NextResponse.json({ erro: "Preencha nome, categoria, descrição, preço e estoque corretamente." }, { status: 400 });
  }
  const { data, error } = await autenticacao.admin.from("produtos").insert({ nome, descricao, categoria, preco, preco_antigo: precoAntigo, estoque, imagem_url: imagemUrl, ativo: true }).select().single();
  if (error) {
    console.error("Erro ao cadastrar produto:", error);
    return NextResponse.json({ erro: `Não foi possível cadastrar o produto: ${error.message}` }, { status: 500 });
  }
    return NextResponse.json({ mensagem: "Produto cadastrado com sucesso.", produto: data }, { status: 201 });
  } catch (error) {
    console.error("Falha inesperada no cadastro de produto:", error);
    const detalhe = error instanceof Error ? error.message : "erro desconhecido";
    return NextResponse.json({ erro: `Erro interno ao cadastrar: ${detalhe}` }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const autenticacao = await autenticarAdmin();
    if (autenticacao.erro) return autenticacao.erro;
    const body = await request.json();
  const id = Number(body.id);
  if (!Number.isInteger(id) || typeof body.ativo !== "boolean") return NextResponse.json({ erro: "Produto inválido." }, { status: 400 });
  const { data, error } = await autenticacao.admin.from("produtos").update({ ativo: body.ativo }).eq("id", id).select().single();
  if (error) return NextResponse.json({ erro: "Não foi possível alterar o produto." }, { status: 500 });
    return NextResponse.json({ mensagem: "Produto atualizado.", produto: data });
  } catch (error) {
    console.error("Falha inesperada ao alterar produto:", error);
    const detalhe = error instanceof Error ? error.message : "erro desconhecido";
    return NextResponse.json({ erro: `Erro interno ao atualizar: ${detalhe}` }, { status: 500 });
  }
}
