import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const emailNormalizado = String(email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      return NextResponse.json({ erro: "Digite um e-mail válido." }, { status: 400 });
    }

    const supabase = criarClienteAdmin();
    const { error } = await supabase.from("newsletter_inscritos").upsert(
      { email: emailNormalizado, ativo: true, atualizado_em: new Date().toISOString() },
      { onConflict: "email" },
    );
    if (error) throw error;
    return NextResponse.json({ mensagem: "E-mail cadastrado. Você receberá nossas novidades." });
  } catch (erro) {
    console.error("NEWSLETTER_ERRO", erro);
    return NextResponse.json({ erro: "Não foi possível cadastrar agora. Tente novamente." }, { status: 500 });
  }
}
