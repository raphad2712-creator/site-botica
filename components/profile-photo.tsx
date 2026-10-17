"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Icon } from "./ui-icon";

export function ProfilePhoto({ fotoUrl, inicial, nome, email, compact = false }: { fotoUrl?: string | null; inicial: string; nome?: string; email?: string; compact?: boolean }) {
  const [foto, setFoto] = useState(fotoUrl || "");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const ultimaFoto = useRef(fotoUrl || "");

  useEffect(() => {
    const atualizar = (event: Event) => {
      const url = (event as CustomEvent<string>).detail || "";
      ultimaFoto.current = url; setFoto(url); setImagemFalhou(false);
    };
    const ocupacao = (event: Event) => setEnviando((event as CustomEvent<boolean>).detail);
    window.addEventListener("botica-profile-photo", atualizar);
    window.addEventListener("botica-profile-photo-busy", ocupacao);
    return () => { window.removeEventListener("botica-profile-photo", atualizar); window.removeEventListener("botica-profile-photo-busy", ocupacao); };
  }, []);

  function ocupado(value: boolean) {
    setEnviando(value);
    window.dispatchEvent(new CustomEvent("botica-profile-photo-busy", { detail: value }));
  }
  function atualizar(url: string) {
    window.dispatchEvent(new CustomEvent("botica-profile-photo", { detail: url }));
  }
  async function enviar(event: ChangeEvent<HTMLInputElement>) {
    const campo = event.currentTarget;
    const arquivo = campo.files?.[0];
    campo.value = "";
    if (!arquivo || enviando) return;
    setErro(false); setMensagem("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type) || !arquivo.size || arquivo.size > 3 * 1024 * 1024) {
      setErro(true); setMensagem("Escolha uma imagem JPG, PNG ou WebP de até 3 MB."); return;
    }
    const previa = URL.createObjectURL(arquivo);
    setFoto(previa); setImagemFalhou(false); ocupado(true);
    try {
      const dados = new FormData(); dados.append("foto", arquivo);
      const response = await fetch("/api/perfil/foto", { method: "POST", body: dados, signal: AbortSignal.timeout(30000) });
      const data = await response.json();
      if (!response.ok || !data.foto_url) throw new Error(data.erro || "Não foi possível salvar sua foto.");
      atualizar(data.foto_url); setMensagem("Foto atualizada com sucesso.");
    } catch (error) {
      setFoto(ultimaFoto.current); setErro(true);
      setMensagem(error instanceof Error && error.name !== "TimeoutError" ? error.message : "O envio demorou. Atualize a página para conferir a foto e tente novamente se necessário.");
    } finally { URL.revokeObjectURL(previa); ocupado(false); }
  }
  async function remover() {
    if (enviando) return;
    ocupado(true); setErro(false); setMensagem("");
    try {
      const response = await fetch("/api/perfil/foto", { method: "DELETE", signal: AbortSignal.timeout(30000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || "Não foi possível remover sua foto.");
      atualizar(""); setMensagem("Foto removida.");
    } catch { setErro(true); setMensagem("Não foi possível confirmar a remoção. Atualize a página e tente novamente."); }
    finally { ocupado(false); }
  }
  return <div className={`profile-photo-control${compact ? " compact" : ""}`} aria-busy={enviando}>
    <div className="profile-photo-content">
      <button className="profile-avatar-button" type="button" onClick={() => input.current?.click()} disabled={enviando} aria-label={foto ? "Trocar foto de perfil" : "Adicionar foto de perfil"}>
        {foto && !imagemFalhou ? <img src={foto} alt="Sua foto de perfil" onError={() => setImagemFalhou(true)} /> : <span>{inicial}</span>}
        <i>{enviando ? <span className="profile-uploading" /> : <Icon name="upload" />}</i>
      </button>
      <div className="profile-photo-copy">
        {compact ? <><small>BEM-VINDO(A) À BOTICA</small><b>{nome}</b><span className="profile-identity-email">{email}</span></> : <><b>Sua foto de perfil</b><span>Personalize a sua conta com uma foto.</span></>}
        <div className="profile-photo-buttons"><button type="button" onClick={() => input.current?.click()} disabled={enviando}>{enviando ? "Enviando foto…" : foto ? "Trocar foto" : "Adicionar foto"}</button>{foto && <button type="button" className="profile-photo-remove" onClick={remover} disabled={enviando}>Remover</button>}</div>
        <small className="profile-photo-hint">JPG, PNG ou WebP · até 3 MB</small>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={enviar} hidden aria-label="Selecionar foto de perfil" />
    </div>
    {mensagem && <p className={`profile-photo-message${erro ? " error" : ""}`} role={erro ? "alert" : "status"}>{mensagem}</p>}
  </div>;
}
