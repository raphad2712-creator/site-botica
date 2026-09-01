"use client";

import { FormEvent, useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { criarClienteSupabase } from "@/lib/supabase/client";

// A primeira função da Vercel pode levar mais tempo para iniciar em redes móveis.
const TEMPO_LIMITE = 35000;

function comTempoLimite<T>(promessa: PromiseLike<T>): Promise<T> {
  return Promise.race([
    Promise.resolve(promessa),
    new Promise<T>((_, rejeitar) => window.setTimeout(() => rejeitar(new Error("timeout")), TEMPO_LIMITE)),
  ]);
}

function traduzirErro(mensagem = "") {
  const erro = mensagem.toLowerCase();
  if (erro.includes("e-mail ou senha incorretos")) return "E-mail ou senha incorretos.";
  if (erro.includes("confirme seu e-mail")) return "Confirme seu e-mail antes de entrar.";
  if (erro.includes("muitas tentativas")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (erro.includes("timeout")) return "A conexão demorou demais. Verifique sua internet e tente novamente.";
  if (erro.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (erro.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (erro.includes("already registered") || erro.includes("already been registered")) return "Este e-mail já possui uma conta.";
  if (erro.includes("rate limit") || erro.includes("too many requests")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (erro.includes("password")) return "Use uma senha com pelo menos 8 caracteres.";
  if (erro.includes("provider") || erro.includes("unsupported")) return "Este acesso social ainda precisa ser ativado no Supabase.";
  return "Não foi possível concluir o acesso. Tente novamente.";
}

export default function LoginPage() {
  const [cadastro, setCadastro] = useState(false);
  const [recuperacao, setRecuperacao] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  function destinoDepoisDoLogin() {
    const solicitado = new URLSearchParams(window.location.search).get("next");
    return solicitado?.startsWith("/") && !solicitado.startsWith("//") ? solicitado : "/minha-conta";
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (carregando) return;
    setCarregando(true);
    setMensagem("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const nome = String(form.get("nome") ?? "").trim();
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), TEMPO_LIMITE);
      const resposta = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ acao: cadastro ? "cadastro" : "login", email, password, nome }),
        signal: controller.signal,
      });
      window.clearTimeout(timer);
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.erro ?? "Falha de autenticação");

      if (cadastro && dados.confirmacaoNecessaria) {
        setMensagem("Conta criada. Abra o e-mail de confirmação para ativar seu acesso.");
        return;
      }
      window.location.assign(destinoDepoisDoLogin());
    } catch (erro) {
      const mensagemErro = erro instanceof DOMException && erro.name === "AbortError" ? "timeout" : erro instanceof Error ? erro.message : "";
      setMensagem(traduzirErro(mensagemErro));
    } finally {
      setCarregando(false);
    }
  }

  async function entrarCom(provider: Provider) {
    if (carregando) return;
    setCarregando(true);
    setMensagem("");
    try {
      const supabase = criarClienteSupabase();
      const { error } = await comTempoLimite(supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destinoDepoisDoLogin())}`,
          ...(provider === "azure" ? { scopes: "email" } : {}),
        },
      }));
      if (error) throw error;
    } catch (erro) {
      setMensagem(traduzirErro(erro instanceof Error ? erro.message : ""));
      setCarregando(false);
    }
  }

  async function enviarRecuperacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (carregando) return;
    setCarregando(true); setMensagem("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    try {
      const supabase = criarClienteSupabase();
      const { error } = await comTempoLimite(supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha` }));
      if (error) throw error;
      setMensagem("Enviamos um link para redefinir sua senha. Verifique também a caixa de spam.");
    } catch (erro) { setMensagem(traduzirErro(erro instanceof Error ? erro.message : "")); }
    finally { setCarregando(false); }
  }

  return (
    <section className="auth-card" aria-busy={carregando}>
      <small>ÁREA DO CLIENTE</small>
      <h1>{recuperacao ? "Recuperar senha" : cadastro ? "Criar conta" : "Entrar"}</h1>
      <p className="auth-subtitle">{recuperacao ? "Informe seu e-mail para receber o link de redefinição" : cadastro ? "Crie sua conta para acompanhar os pedidos" : "Acesse com segurança para continuar"}</p>
      {!recuperacao && <><div className="social-login" aria-label="Entrar com uma rede social">
        <button type="button" onClick={() => entrarCom("google")} disabled={carregando} aria-label="Entrar com Google" title="Entrar com Google"><GoogleIcon /></button>
        <button type="button" onClick={() => entrarCom("azure")} disabled={carregando} aria-label="Entrar com Microsoft" title="Entrar com Microsoft"><MicrosoftIcon /></button>
        <button type="button" onClick={() => entrarCom("apple")} disabled={carregando} aria-label="Entrar com Apple" title="Entrar com Apple"><AppleIcon /></button>
      </div><div className="auth-divider"><span>ou use seu e-mail</span></div></>}
      <form onSubmit={recuperacao ? enviarRecuperacao : enviar}>
        {cadastro && <input name="nome" autoComplete="name" placeholder="Nome completo" minLength={3} required disabled={carregando} />}
        <input name="email" type="email" inputMode="email" autoComplete="email" placeholder="E-mail" required disabled={carregando} />
        {!recuperacao && <input name="password" type="password" autoComplete={cadastro ? "new-password" : "current-password"} minLength={cadastro ? 8 : 6} placeholder="Senha" required disabled={carregando} />}
        <button type="submit" disabled={carregando}>{carregando ? <><span className="auth-spinner" aria-hidden="true" /> AGUARDE...</> : recuperacao ? "ENVIAR LINK DE RECUPERAÇÃO" : cadastro ? "CADASTRAR" : "ENTRAR"}</button>
      </form>
      {mensagem && <p className="form-message" role="status">{mensagem}</p>}
      {!cadastro && !recuperacao && <button type="button" className="text-button auth-forgot" disabled={carregando} onClick={() => { setRecuperacao(true); setMensagem(""); }}>Esqueci minha senha</button>}
      {!recuperacao && <button type="button" className="text-button" disabled={carregando} onClick={() => { setCadastro(!cadastro); setMensagem(""); }}>
        {cadastro ? "Já tenho uma conta" : "Ainda não tenho uma conta"}
      </button>}
      {recuperacao && <button type="button" className="text-button" disabled={carregando} onClick={() => { setRecuperacao(false); setMensagem(""); }}>← Voltar para o login</button>}
    </section>
  );
}

function GoogleIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.35l-3.24-2.55c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.06v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.93A6 6 0 0 1 6.08 12c0-.67.11-1.32.32-1.93V7.45H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.55l3.34-2.62Z"/><path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.45l3.34 2.62C7.19 7.7 9.4 5.94 12 5.94Z"/></svg>;
}
function MicrosoftIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#f35325" d="M2 2h9.5v9.5H2z"/><path fill="#81bc06" d="M12.5 2H22v9.5h-9.5z"/><path fill="#05a6f0" d="M2 12.5h9.5V22H2z"/><path fill="#ffba08" d="M12.5 12.5H22V22h-9.5z"/></svg>;
}
function AppleIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.05 12.54c-.03-3.07 2.5-4.56 2.61-4.63a5.6 5.6 0 0 0-4.4-2.38c-1.85-.19-3.65 1.11-4.59 1.11-.96 0-2.42-1.09-3.98-1.06a5.85 5.85 0 0 0-4.92 3c-2.13 3.69-.54 9.12 1.5 12.1 1.02 1.46 2.2 3.08 3.76 3.02 1.52-.06 2.09-.97 3.92-.97 1.81 0 2.35.97 3.94.93 1.64-.02 2.67-1.46 3.65-2.94a12.1 12.1 0 0 0 1.67-3.4 5.27 5.27 0 0 1-3.16-4.78ZM14.05 3.57A5.34 5.34 0 0 0 15.28 0a5.43 5.43 0 0 0-3.5 1.7 5.08 5.08 0 0 0-1.26 3.44 4.5 4.5 0 0 0 3.53-1.57Z"/></svg>;
}
