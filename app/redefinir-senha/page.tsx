"use client";

import { FormEvent, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/lib/supabase/client";

export default function RedefinirSenhaPage() {
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [validando, setValidando] = useState(true);
  const [sessaoValida, setSessaoValida] = useState(false);

  useEffect(() => {
    async function prepararRecuperacao() {
      const supabase = criarClienteSupabase();
      const parametros = new URLSearchParams(window.location.search);
      const erroLink = parametros.get("error_description");
      if (erroLink) {
        setMensagem("Este link não pôde ser validado. Solicite um novo link abaixo.");
        setValidando(false);
        return;
      }
      const code = parametros.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { setMensagem("O link expirou ou já foi utilizado. Solicite um novo link."); setValidando(false); return; }
        setSessaoValida(true);
        window.history.replaceState({}, "", "/redefinir-senha");
      }
      const tokenHash = parametros.get("token_hash");
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (error) { setMensagem("O link expirou ou já foi utilizado. Solicite um novo link."); setValidando(false); return; }
        setSessaoValida(true);
        window.history.replaceState({}, "", "/redefinir-senha");
      }
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) { setMensagem("O link de recuperação não é mais válido."); setValidando(false); return; }
        setSessaoValida(true);
        window.history.replaceState({}, "", "/redefinir-senha");
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) setSessaoValida(true);
      else if (!code && !tokenHash && !(accessToken && refreshToken)) setMensagem("Abra esta página pelo link mais recente enviado ao seu e-mail.");
      setValidando(false);
    }
    prepararRecuperacao();
  }, []);

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (carregando || validando || !sessaoValida) return;
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

  return <section className="auth-card"><small>ÁREA DO CLIENTE</small><h1>Nova senha</h1><p className="auth-subtitle">{validando ? "Validando seu link de recuperação..." : sessaoValida ? "Crie uma senha segura com pelo menos 8 caracteres" : "Solicite um novo link para continuar"}</p>{sessaoValida && <form onSubmit={salvar}><input name="senha" type="password" autoComplete="new-password" minLength={8} placeholder="Nova senha" required disabled={carregando || validando} /><input name="confirmar" type="password" autoComplete="new-password" minLength={8} placeholder="Confirmar nova senha" required disabled={carregando || validando} /><button type="submit" disabled={carregando || validando}>{validando ? "VALIDANDO LINK..." : carregando ? "SALVANDO..." : "ALTERAR SENHA"}</button></form>}{mensagem && <p className="form-message" role="status">{mensagem}</p>}<a className="auth-back-link" href="/login">{sessaoValida ? "← Voltar para o login" : "← Solicitar novo link"}</a></section>;
}
