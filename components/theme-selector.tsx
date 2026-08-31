"use client";

import { useEffect, useState } from "react";

type Tema = "light" | "dark" | "auto";

function aplicar(tema: Tema) {
  // O automático usa o visual claro como padrão da loja. O escuro só é
  // ativado quando a pessoa o escolhe explicitamente.
  const escuro = tema === "dark";
  document.documentElement.dataset.theme = escuro ? "dark" : "light";
  document.documentElement.dataset.themePreference = tema;
}

export function ThemeSelector() {
  const [tema, setTema] = useState<Tema>("auto");

  useEffect(() => {
    const salvo = (localStorage.getItem("botica-theme") as Tema | null) ?? "auto";
    setTema(salvo); aplicar(salvo);
  }, []);

  function alterar(valor: Tema) {
    setTema(valor); localStorage.setItem("botica-theme", valor); aplicar(valor);
  }

  return <label className="theme-selector" title="Escolher aparência do site">
    <span aria-hidden="true">{tema === "dark" ? "☾" : tema === "light" ? "☀" : "◐"}</span>
    <b>Tema</b>
    <select value={tema} onChange={(event) => alterar(event.target.value as Tema)} aria-label="Tema do site">
      <option value="light">Claro</option>
      <option value="dark">Escuro</option>
      <option value="auto">Automático</option>
    </select>
  </label>;
}
