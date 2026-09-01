"use client";

import { FormEvent, useState } from "react";
import { criarClienteSupabase } from "@/lib/supabase/client";

export default function RedefinirSenhaPage() {
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (carregando) return;
    const form = new FormData(event.currentTarget);
    const senha = String(form.get("senha") ?? "");
    const confirmar = String(form.get("confirmar") ?? "");
    if (senha.length < 8) return setMensagem("A senha precisa ter pelo menos 8 caracteres.");
    if (senha !== confirmar) return setMensagem("As duas senhas precisam ser iguais.");
    setCarregando(true); setMensagem("");
    const supabase = criarClienteSupabase();
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) { setMensagem("O link expirou ou não é válido. Solicite um novo link."); setCarregando(false); return; }
    setMensagem("Senha alterada com sucesso. Você já pode entrar na sua conta.");
    setCarregando(false);
    window.setTimeout(() => window.location.assign("/login"), 1800);
  }

  return <section className="auth-card"><small>ÁREA DO CLIENTE</small><h1>Nova senha</h1><p className="auth-subtitle">Crie uma senha segura com pelo menos 8 caracteres</p><form onSubmit={salvar}><input name="senha" type="password" autoComplete="new-password" minLength={8} placeholder="Nova senha" required disabled={carregando} /><input name="confirmar" type="password" autoComplete="new-password" minLength={8} placeholder="Confirmar nova senha" required disabled={carregando} /><button type="submit" disabled={carregando}>{carregando ? "SALVANDO..." : "ALTERAR SENHA"}</button></form>{mensagem && <p className="form-message" role="status">{mensagem}</p>}<a className="auth-back-link" href="/login">← Voltar para o login</a></section>;
}
