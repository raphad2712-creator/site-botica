"use client";

import { FormEvent, useState } from "react";
import { criarClienteSupabase } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [mensagem, setMensagem] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setEntrando(true); setMensagem("");
    const form = new FormData(event.currentTarget);
    const supabase = criarClienteSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("senha")) });
    if (error || !data.user) { setMensagem("E-mail ou senha de administrador incorretos."); setEntrando(false); return; }
    const { data: perfil } = await supabase.from("perfis").select("funcao").eq("id", data.user.id).maybeSingle();
    if (perfil?.funcao !== "admin") { await supabase.auth.signOut(); setMensagem("Esta conta não possui permissão de administrador."); setEntrando(false); return; }
    window.location.href = "/admin";
  }

  return <main className="admin-login-page"><section className="admin-login-card"><div className="admin-login-brand"><span>B</span><div><small>ÁREA PROTEGIDA</small><h1>Administração Botica</h1><p>Entre com uma conta autorizada para gerenciar a loja.</p></div></div><form onSubmit={entrar}><label>E-mail administrativo<input name="email" type="email" defaultValue="raphad2712@gmail.com" autoComplete="username" required /></label><label>Senha<input name="senha" type="password" autoComplete="current-password" placeholder="Digite sua senha" required /></label><button disabled={entrando}>{entrando ? "VERIFICANDO..." : "ENTRAR NO PAINEL"}</button>{mensagem && <p role="alert">{mensagem}</p>}</form><a href="/">← Voltar para a loja</a></section></main>;
}
