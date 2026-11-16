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
    try {
    const login = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "login", email: String(form.get("email")), password: String(form.get("senha")) }) });
    if (!login.ok) { setMensagem("Não foi possível entrar. Confira os dados ou tente novamente mais tarde."); setEntrando(false); return; }
    const acesso = await fetch("/api/admin/acesso", { cache: "no-store" });
    if (!acesso.ok) { await supabase.auth.signOut(); setMensagem("Acesso administrativo indisponível. Confira a autorização da conta e a atualização de segurança do site."); setEntrando(false); return; }
    window.location.href = "/admin";
    } catch { setMensagem("Não foi possível conectar. Tente novamente."); setEntrando(false); }
  }

  return <main className="admin-login-page"><section className="admin-login-card"><div className="admin-login-brand"><span>B</span><div><small>ÁREA PROTEGIDA</small><h1>Administração Botica</h1><p>Entre com uma conta autorizada para gerenciar a loja.</p></div></div><form onSubmit={entrar}><label>E-mail administrativo<input name="email" type="email" defaultValue="flavio_farmaceutico@hotmail.com" autoComplete="username" required /></label><label>Senha<input name="senha" type="password" autoComplete="current-password" placeholder="Digite sua senha" required /></label><button disabled={entrando}>{entrando ? "VERIFICANDO..." : "ENTRAR NO PAINEL"}</button>{mensagem && <p role="alert">{mensagem}</p>}</form><a href="/">← Voltar para a loja</a></section></main>;
}
