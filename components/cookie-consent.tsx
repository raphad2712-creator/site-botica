"use client";

import { useEffect, useState } from "react";

type Escolha = "aceitos" | "recusados";

export function CookieConsent() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    setVisivel(!localStorage.getItem("botica-cookie-consent"));
    const abrir = () => setVisivel(true);
    window.addEventListener("botica:cookie-settings", abrir);
    return () => window.removeEventListener("botica:cookie-settings", abrir);
  }, []);

  function escolher(valor: Escolha) {
    localStorage.setItem("botica-cookie-consent", valor);
    localStorage.setItem("botica-cookie-consent-date", new Date().toISOString());
    window.dispatchEvent(new CustomEvent("botica:cookie-consent", { detail: valor }));
    setVisivel(false);
  }

  if (!visivel) return null;
  return <aside className="cookie-consent" role="dialog" aria-modal="true" aria-label="Preferências de cookies">
    <div className="cookie-icon">◌</div>
    <div><small>PRIVACIDADE E COOKIES</small><h2>Sua escolha importa</h2><p>Utilizamos cookies necessários para manter sua conta e o carrinho funcionando. Com sua autorização, também poderemos usar cookies de análise para melhorar a experiência.</p><a href="/politica-de-privacidade">Saiba mais na Política de Privacidade</a></div>
    <div className="cookie-actions"><button type="button" onClick={() => escolher("recusados")}>RECUSAR OPCIONAIS</button><button type="button" onClick={() => escolher("aceitos")}>ACEITAR COOKIES</button></div>
  </aside>;
}

export function CookieSettingsButton() {
  return <button className="cookie-settings-button" type="button" onClick={() => window.dispatchEvent(new Event("botica:cookie-settings"))}>Preferências de cookies</button>;
}
