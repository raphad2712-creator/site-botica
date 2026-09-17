import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { emailValido, limiteExcedido, respostaMuitasTentativas } from "@/lib/security";

export async function POST(request: Request) {
  try {
    if (await limiteExcedido(request, "newsletter", 5, 3600)) return respostaMuitasTentativas(3600);
    const { email, consentimento } = await request.json();
    const emailNormalizado = emailValido(email);
    if (!emailNormalizado || consentimento !== true) {
      return NextResponse.json({ erro: "Digite um e-mail válido e confirme o consentimento." }, { status: 400 });
    }

    const supabase = criarClienteAdmin();
    let { error } = await supabase.from("newsletter_inscritos").upsert(
      { email: emailNormalizado, ativo: true, consentimento_em: new Date().toISOString(), politica_versao: "2026-09-17", origem: "site", cancelado_em: null, atualizado_em: new Date().toISOString() },
      { onConflict: "email" },
    );
    if (error && (error.code === "42703" || error.code === "PGRST204")) {
      const legado = await supabase.from("newsletter_inscritos").upsert({ email: emailNormalizado, ativo: true, atualizado_em: new Date().toISOString() }, { onConflict: "email" });
      error = legado.error;
    }
    if (error) throw error;
    return NextResponse.json({ mensagem: "E-mail cadastrado. Você receberá nossas novidades." });
  } catch (erro) {
    console.error("NEWSLETTER_ERRO", erro);
    return NextResponse.json({ erro: "Não foi possível cadastrar agora. Tente novamente." }, { status: 500 });
  }
}
