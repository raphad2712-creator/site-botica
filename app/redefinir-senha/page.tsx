"use client";

import { FormEvent, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/lib/supabase/client";

export default function RedefinirSenhaPage() {
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [validando, setValidando] = useState(true);
  const [sessaoValida, setSessaoValida] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function prepararRecuperacao() {
      const supabase = criarClienteSupabase();
      const parametros = new URLSearchParams(window.location.search);
      const erroLink = parametros.get("error_description");
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const code = parametros.get("code");
      const tokenHash = parametros.get("token_hash");

      async function sessaoAtualValida() {
        const { data } = await supabase.auth.getUser();
        return Boolean(data.user);
      }

      // O Supabase pode processar o link automaticamente. Antes de trocar o
      // código novamente, aproveitamos a sessão que já foi criada no navegador.
      if (await sessaoAtualValida()) {
        if (!ativo) return;
        setSessaoValida(true);
        setValidando(false);
        window.history.replaceState({}, "", "/redefinir-senha");
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!error && await sessaoAtualValida()) {
          if (!ativo) return;
          setSessaoValida(true);
          setValidando(false);
          window.history.replaceState({}, "", "/redefinir-senha");
          return;
        }
      } else if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (!error && await sessaoAtualValida()) {
          if (!ativo) return;
          setSessaoValida(true);
          setValidando(false);
          window.history.replaceState({}, "", "/redefinir-senha");
          return;
        }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        // createBrowserClient também pode ter consumido o código; nesse caso a
        // sessão existente continua sendo válida e não deve ser rejeitada.
        if ((!error || await sessaoAtualValida()) && await sessaoAtualValida()) {
          if (!ativo) return;
          setSessaoValida(true);
          setValidando(false);
          window.history.replaceState({}, "", "/redefinir-senha");
          return;
        }
      }

      if (!ativo) return;
      setMensagem(erroLink
        ? "Este link expirou ou já foi utilizado. Solicite um novo link."
        : "Não foi possível validar este link. Solicite um novo link e abra somente o e-mail mais recente.");
      setValidando(false);
    }
    prepararRecuperacao();
    return () => { ativo = false; };
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
    if (error) {
      const detalhe = error.message.toLowerCase();
      setMensagem(detalhe.includes("different") || detalhe.includes("same")
        ? "Escolha uma senha diferente da senha atual."
        : detalhe.includes("session") || detalhe.includes("jwt")
          ? "Sua sessão de recuperação expirou. Solicite um novo link."
          : "Não foi possível alterar a senha agora. Tente novamente.");
      setCarregando(false);
      return;
    }
    setMensagem("Senha alterada com sucesso. Você já pode entrar na sua conta.");
    setCarregando(false);
    window.setTimeout(() => window.location.assign("/login"), 1800);
  }

  return <section className="auth-card"><small>ÁREA DO CLIENTE</small><h1>Nova senha</h1><p className="auth-subtitle">{validando ? "Validando seu link de recuperação..." : sessaoValida ? "Crie uma senha segura com pelo menos 8 caracteres" : "Solicite um novo link para continuar"}</p>{sessaoValida && <form onSubmit={salvar}><input name="senha" type="password" autoComplete="new-password" minLength={8} placeholder="Nova senha" required disabled={carregando || validando} /><input name="confirmar" type="password" autoComplete="new-password" minLength={8} placeholder="Confirmar nova senha" required disabled={carregando || validando} /><button type="submit" disabled={carregando || validando}>{validando ? "VALIDANDO LINK..." : carregando ? "SALVANDO..." : "ALTERAR SENHA"}</button></form>}{mensagem && <p className="form-message" role="status">{mensagem}</p>}<a className="auth-back-link" href="/login">{sessaoValida ? "← Voltar para o login" : "← Solicitar novo link"}</a></section>;
}
