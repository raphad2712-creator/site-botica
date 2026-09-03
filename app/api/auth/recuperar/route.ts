import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ erro: "Informe seu e-mail." }, { status: 400 });

    // O fluxo implícito permite abrir o e-mail em outro aparelho ou no navegador
    // interno do Gmail, sem depender do verificador PKCE salvo no aparelho inicial.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false } },
    );
    const origem = new URL(request.url).origin;
    const { error } = await supabase.auth.resetPasswordForEmail(String(email).trim().toLowerCase(), {
      redirectTo: `${origem}/redefinir-senha`,
    });
    if (error) return NextResponse.json({ erro: error.message }, { status: 400 });
    return NextResponse.json({ sucesso: true });
  } catch {
    return NextResponse.json({ erro: "Não foi possível enviar o link agora." }, { status: 500 });
  }
}
