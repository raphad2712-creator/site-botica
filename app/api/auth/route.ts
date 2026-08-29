import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { acao, email, password, nome } = await request.json();
    if (!email || !password) return NextResponse.json({ erro: "Preencha e-mail e senha." }, { status: 400 });
    const supabase = await criarClienteServidor();
    const origem = new URL(request.url).origin;
    const resposta = acao === "cadastro"
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nome },
            emailRedirectTo: `${origem}/auth/callback?next=/minha-conta`,
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });
    if (resposta.error) {
      const mensagem = resposta.error.message.toLowerCase();
      const erro = mensagem.includes("invalid login") ? "E-mail ou senha incorretos."
        : mensagem.includes("email not confirmed") ? "Confirme seu e-mail antes de entrar."
        : mensagem.includes("already registered") ? "Este e-mail já possui uma conta."
        : mensagem.includes("rate limit") ? "Muitas tentativas. Aguarde alguns minutos."
        : "Não foi possível concluir o acesso.";
      return NextResponse.json({ erro }, { status: 400 });
    }
    return NextResponse.json({
      sucesso: true,
      confirmacaoNecessaria: acao === "cadastro" && !resposta.data.session,
    });
  } catch {
    return NextResponse.json({ erro: "Falha ao conectar com o Supabase." }, { status: 500 });
  }
}
