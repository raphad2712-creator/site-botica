import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { emailValido, limiteExcedido, respostaMuitasTentativas } from "@/lib/security";

export async function POST(request: Request) {
  if (await limiteExcedido(request, "cancelar-newsletter", 5, 3600)) return respostaMuitasTentativas(3600);
  const { email } = await request.json();
  const emailNormalizado = emailValido(email);
  if (!emailNormalizado) return NextResponse.json({ erro: "Informe um e-mail válido." }, { status: 400 });
  const admin = criarClienteAdmin();
  const agora = new Date().toISOString();
  const { error } = await admin.from("newsletter_inscritos").update({ ativo: false, cancelado_em: agora, atualizado_em: agora }).eq("email", emailNormalizado);
  if (error && (error.code === "42703" || error.code === "PGRST204")) await admin.from("newsletter_inscritos").update({ ativo: false, atualizado_em: agora }).eq("email", emailNormalizado);
  return NextResponse.json({ mensagem: "Se o e-mail estava cadastrado, o recebimento de comunicações foi cancelado." });
}
