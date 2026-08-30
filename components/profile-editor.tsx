"use client";

import { FormEvent, useState } from "react";

export type PerfilCliente = { nome?: string | null; email?: string | null; cpf?: string | null; telefone?: string | null; nascimento?: string | null; genero?: string | null; cep?: string | null; rua?: string | null; numero?: string | null; complemento?: string | null; bairro?: string | null; cidade?: string | null; estado?: string | null };

export function ProfileEditor({ perfil, inicial }: { perfil: PerfilCliente; inicial: string }) {
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSalvando(true); setMensagem("");
    const dados = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const resposta = await fetch("/api/perfil", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
      const resultado = await resposta.json();
      setMensagem(resultado.mensagem ?? resultado.erro);
      if (resposta.ok) { setEditando(false); window.setTimeout(() => window.location.reload(), 700); }
    } catch { setMensagem("Não foi possível salvar agora."); }
    finally { setSalvando(false); }
  }

  return <section className="account-profile" id="dados">
    <div className="account-profile-avatar">{inicial}</div>
    <small>SEUS DADOS</small><h2>Meus dados</h2>
    {!editando ? <>
      <dl>
        <div><dt>Nome</dt><dd>{perfil.nome || "Não informado"}</dd></div><div><dt>E-mail</dt><dd>{perfil.email}</dd></div>
        <div><dt>CPF</dt><dd>{perfil.cpf || "Não informado"}</dd></div><div><dt>Telefone</dt><dd>{perfil.telefone || "Não informado"}</dd></div>
        <div><dt>Nascimento</dt><dd>{perfil.nascimento ? new Date(`${perfil.nascimento}T12:00:00`).toLocaleDateString("pt-BR") : "Não informado"}</dd></div>
        <div><dt>Endereço</dt><dd>{perfil.rua ? `${perfil.rua}, ${perfil.numero || "s/n"} — ${perfil.cidade || ""}/${perfil.estado || ""}` : "Não informado"}</dd></div>
      </dl>
      <button className="profile-edit-button" onClick={() => setEditando(true)}>✎ ALTERAR MEUS DADOS</button>
    </> : <form className="profile-form" onSubmit={salvar}>
      <div className="profile-form-section"><h3>Dados pessoais</h3><div className="profile-form-grid">
        <label className="wide">Nome completo<input name="nome" defaultValue={perfil.nome ?? ""} required /></label>
        <label>CPF<input name="cpf" defaultValue={perfil.cpf ?? ""} inputMode="numeric" maxLength={14} required /></label>
        <label>Telefone<input name="telefone" defaultValue={perfil.telefone ?? ""} inputMode="tel" /></label>
        <label>Nascimento<input name="nascimento" defaultValue={perfil.nascimento ?? ""} type="date" /></label>
        <label>Gênero<select name="genero" defaultValue={perfil.genero ?? ""}><option value="">Prefiro não informar</option><option>Feminino</option><option>Masculino</option><option>Outro</option></select></label>
      </div></div>
      <div className="profile-form-section"><h3>Endereço principal</h3><div className="profile-form-grid">
        <label>CEP<input name="cep" defaultValue={perfil.cep ?? ""} inputMode="numeric" required /></label><label className="wide">Rua<input name="rua" defaultValue={perfil.rua ?? ""} required /></label>
        <label>Número<input name="numero" defaultValue={perfil.numero ?? ""} required /></label><label>Complemento<input name="complemento" defaultValue={perfil.complemento ?? ""} /></label>
        <label>Bairro<input name="bairro" defaultValue={perfil.bairro ?? ""} required /></label><label>Cidade<input name="cidade" defaultValue={perfil.cidade ?? ""} required /></label><label>Estado<input name="estado" defaultValue={perfil.estado ?? ""} maxLength={2} required /></label>
      </div></div>
      <div className="profile-form-actions"><button type="button" onClick={() => setEditando(false)}>CANCELAR</button><button disabled={salvando}>{salvando ? "SALVANDO..." : "SALVAR DADOS"}</button></div>
    </form>}
    {mensagem && <p className="profile-message" role="status">{mensagem}</p>}
  </section>;
}
