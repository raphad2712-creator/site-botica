"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [cadastro, setCadastro] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const router = useRouter();

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("Carregando...");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const nome = String(form.get("nome") ?? "");
    try {
      const resposta = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: cadastro ? "cadastro" : "login", email, password, nome }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) return setMensagem(dados.erro ?? "Não foi possível continuar.");
      if (cadastro) return setMensagem("Cadastro criado. Confira seu e-mail para confirmar a conta.");
      router.push("/minha-conta");
      router.refresh();
    } catch {
      setMensagem("Não foi possível conectar. Confira o Supabase e tente novamente.");
    }
  }

  return (
    <section className="auth-card">
      <small>ÁREA DO CLIENTE</small>
      <h1>{cadastro ? "Criar conta" : "Entrar"}</h1>
      <form onSubmit={enviar}>
        {cadastro && <input name="nome" placeholder="Nome completo" required />}
        <input name="email" type="email" placeholder="E-mail" required />
        <input name="password" type="password" minLength={6} placeholder="Senha" required />
        <button>{cadastro ? "CADASTRAR" : "ENTRAR"}</button>
      </form>
      {mensagem && <p className="form-message">{mensagem}</p>}
      <button className="text-button" onClick={() => { setCadastro(!cadastro); setMensagem(""); }}>
        {cadastro ? "Já tenho uma conta" : "Ainda não tenho uma conta"}
      </button>
    </section>
  );
}
