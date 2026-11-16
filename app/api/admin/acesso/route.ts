import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { usuarioAdminAutorizado } from "@/lib/admin-access";

export async function GET() {
  const supabase = await criarClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (!await usuarioAdminAutorizado(user, supabase)) return NextResponse.json({ erro: "Acesso restrito." }, { status: 403 });
  return NextResponse.json({ autorizado: true }, { headers: { "Cache-Control": "no-store" } });
}
