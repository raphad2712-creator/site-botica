import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { emailValido, limiteExcedido, respostaMuitasTentativas } from "@/lib/security";

export async function POST(request: Request) {
  try {
    if (await limiteExcedido(request, "auth", 8, 600)) return respostaMuitasTentativas(600);
    const { acao, email, password, nome } = await request.json();
    const emailNormalizado = emailValido(email);
    const senha = String(password ?? "");
    const nomeNormalizado = String(nome ?? "").trim().slice(0, 100);
    const tamanhoMinimo = acao === "cadastro" ? 8 : 6;
    if (!emailNormalizado || !["login", "cadastro"].includes(String(acao)) || senha.length < tamanhoMinimo || senha.length > 128 || (acao === "cadastro" && nomeNormalizado.length < 3)) return NextResponse.json({ erro: "Confira e-mail, nome e senha. Novas senhas devem ter pelo menos 8 caracteres." }, { status: 400 });
    const supabase = await criarClienteServidor();
    const origem = new URL(request.url).origin;
    const resposta = acao === "cadastro"
      ? await supabase.auth.signUp({
          email: emailNormalizado,
          password: senha,
          options: {
            data: { nome: nomeNormalizado },
            emailRedirectTo: `${origem}/auth/callback?next=/minha-conta`,
          },
        })
      : await supabase.auth.signInWithPassword({ email: emailNormalizado, password: senha });
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
