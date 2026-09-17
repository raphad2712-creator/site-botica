import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailValido, limiteExcedido, respostaMuitasTentativas } from "@/lib/security";

export async function POST(request: Request) {
  try {
    if (await limiteExcedido(request, "recuperar-senha", 4, 3600)) return respostaMuitasTentativas(3600);
    const { email } = await request.json();
    const emailNormalizado = emailValido(email);
    if (!emailNormalizado) return NextResponse.json({ erro: "Informe um e-mail válido." }, { status: 400 });

    // O fluxo implícito permite abrir o e-mail em outro aparelho ou no navegador
    // interno do Gmail, sem depender do verificador PKCE salvo no aparelho inicial.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false } },
    );
    const origem = new URL(request.url).origin;
    await supabase.auth.resetPasswordForEmail(emailNormalizado, {
      redirectTo: `${origem}/redefinir-senha`,
    });
    // A resposta é sempre genérica para não revelar se o e-mail possui conta.
    return NextResponse.json({ sucesso: true });
  } catch {
    return NextResponse.json({ erro: "Não foi possível enviar o link agora." }, { status: 500 });
  }
}
