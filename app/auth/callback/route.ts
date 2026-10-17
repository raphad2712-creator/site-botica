import { destinoLocal } from "@/lib/safe-redirect";
import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next") ?? "/minha-conta";
  const recuperacao = url.searchParams.get("type") === "recovery" || url.searchParams.get("modo") === "recovery";
  const next = recuperacao ? "/redefinir-senha" : destinoLocal(requestedNext);
  if (code) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/login?erro=oauth", url.origin));
}
