import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

const campos = ["nome", "cpf", "telefone", "nascimento", "genero", "cep", "rua", "numero", "complemento", "bairro", "cidade", "estado"] as const;

export async function GET() {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const { data, error } = await supabase.from("perfil_clientes").select(campos.join(",")).eq("usuario_id", auth.user.id).maybeSingle();
  if (error) return NextResponse.json({ erro: "Não foi possível carregar os dados." }, { status: 500 });
  const perfil = (data ?? {}) as Record<string, string | null>;
  return NextResponse.json({ perfil: { email: auth.user.email, ...perfil } });
}

export async function PUT(request: Request) {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const body = await request.json();
  const perfil: Record<string, string | null> = {};
  for (const campo of campos) {
    const valor = String(body[campo] ?? "").trim();
    perfil[campo] = valor || null;
  }
  perfil.cpf = String(perfil.cpf ?? "").replace(/\D/g, "").slice(0, 11) || null;
  perfil.cep = String(perfil.cep ?? "").replace(/\D/g, "").slice(0, 8) || null;
  perfil.estado = String(perfil.estado ?? "").toUpperCase().slice(0, 2) || null;
  if (perfil.cpf && perfil.cpf.length !== 11) return NextResponse.json({ erro: "Informe um CPF com 11 números." }, { status: 400 });
  const { error } = await supabase.from("perfil_clientes").upsert({ usuario_id: auth.user.id, ...perfil, atualizado_em: new Date().toISOString() }, { onConflict: "usuario_id" });
  if (error) return NextResponse.json({ erro: "Não foi possível salvar os dados." }, { status: 500 });
  if (perfil.nome) await supabase.auth.updateUser({ data: { nome: perfil.nome, telefone: perfil.telefone } });
  return NextResponse.json({ mensagem: "Dados salvos com sucesso." });
}
