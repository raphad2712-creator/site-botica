import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { acao, email, password, nome } = await request.json();
    if (!email || !password) return NextResponse.json({ erro: "Preencha e-mail e senha." }, { status: 400 });
    const supabase = await criarClienteServidor();
    const resposta = acao === "cadastro"
      ? await supabase.auth.signUp({ email, password, options: { data: { nome } } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (resposta.error) {
      const mensagens: Record<string, string> = {
        "Invalid login credentials": "E-mail ou senha incorretos.",
        "Email not confirmed": "Confirme seu e-mail antes de entrar.",
        "User already registered": "Este e-mail já possui uma conta.",
      };
      return NextResponse.json({ erro: mensagens[resposta.error.message] ?? resposta.error.message }, { status: 400 });
    }
    return NextResponse.json({ sucesso: true });
  } catch {
    return NextResponse.json({ erro: "Falha ao conectar com o Supabase." }, { status: 500 });
  }
}
