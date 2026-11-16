import { usuarioAdminAutorizado } from "@/lib/admin-access";
import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

async function autenticarAdmin() {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { erro: NextResponse.json({ erro: "Faça login como administrador." }, { status: 401 }) };
  if (!await usuarioAdminAutorizado(auth.user, supabase)) return { erro: NextResponse.json({ erro: "Sua conta não possui acesso administrativo." }, { status: 403 }) };
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
  const pesoKg = Number(body.peso_kg);
  const alturaCm = Number(body.altura_cm);
  const larguraCm = Number(body.largura_cm);
  const comprimentoCm = Number(body.comprimento_cm);
  const medidas = [pesoKg, alturaCm, larguraCm, comprimentoCm];
  if (!nome || !descricao || !categoria || !Number.isFinite(preco) || preco <= 0 || !Number.isInteger(estoque) || estoque < 0 || (precoAntigo !== null && (!Number.isFinite(precoAntigo) || precoAntigo <= 0)) || medidas.some((valor) => !Number.isFinite(valor) || valor <= 0)) {
    return NextResponse.json({ erro: "Preencha os dados do produto, peso e dimensões corretamente." }, { status: 400 });
  }
  const { data, error } = await autenticacao.admin.from("produtos").insert({ nome, descricao, categoria, preco, preco_antigo: precoAntigo, estoque, estoque_confirmado: true, imagem_url: imagemUrl, peso_kg: pesoKg, altura_cm: alturaCm, largura_cm: larguraCm, comprimento_cm: comprimentoCm, ativo: true }).select().single();
  if (error) {
    console.error("Erro ao cadastrar produto:", error);
    return NextResponse.json({ erro: "Não foi possível cadastrar o produto." }, { status: 500 });
  }
    return NextResponse.json({ mensagem: "Produto cadastrado com sucesso.", produto: data }, { status: 201 });
  } catch (error) {
    console.error("Falha inesperada no cadastro de produto:", error);
    const detalhe = error instanceof Error ? error.message : "erro desconhecido";
    return NextResponse.json({ erro: "Não foi possível cadastrar o produto." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const autenticacao = await autenticarAdmin();
    if (autenticacao.erro) return autenticacao.erro;
    const body = await request.json();
  const id = Number(body.id);
  if (!Number.isInteger(id)) return NextResponse.json({ erro: "Produto inválido." }, { status: 400 });
  let alteracao: Record<string, number | boolean>;
  if (typeof body.ativo === "boolean") {
    alteracao = { ativo: body.ativo };
  } else {
    const pesoKg = Number(body.peso_kg);
    const alturaCm = Number(body.altura_cm);
    const larguraCm = Number(body.largura_cm);
    const comprimentoCm = Number(body.comprimento_cm);
    if ([pesoKg, alturaCm, larguraCm, comprimentoCm].some((valor) => !Number.isFinite(valor) || valor <= 0)) return NextResponse.json({ erro: "Informe peso e dimensões maiores que zero." }, { status: 400 });
    const estoque = Number(body.estoque);
    if (body.estoque_confirmado !== true || !Number.isInteger(estoque) || estoque < 0 || estoque > 100000) return NextResponse.json({ erro: "Confira e informe o estoque físico do produto." }, { status: 400 });
    alteracao = { estoque, estoque_confirmado: true, peso_kg: pesoKg, altura_cm: alturaCm, largura_cm: larguraCm, comprimento_cm: comprimentoCm };
  }
  const { data, error } = await autenticacao.admin.from("produtos").update(alteracao).eq("id", id).select().single();
  if (error) return NextResponse.json({ erro: "Não foi possível alterar o produto." }, { status: 500 });
    return NextResponse.json({ mensagem: "Produto atualizado.", produto: data });
  } catch (error) {
    console.error("Falha inesperada ao alterar produto:", error);
    const detalhe = error instanceof Error ? error.message : "erro desconhecido";
    return NextResponse.json({ erro: "Não foi possível atualizar o produto." }, { status: 500 });
  }
}
