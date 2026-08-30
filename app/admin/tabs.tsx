"use client";

import { useEffect, useState } from "react";

const abas = [
  { id: "overview", icone: "⌂", nome: "Visão geral" },
  { id: "products", icone: "▦", nome: "Produtos" },
  { id: "deliveries", icone: "▤", nome: "Entregas" },
  { id: "requests", icone: "!", nome: "Solicitações" },
  { id: "completed", icone: "✓", nome: "Concluídas" },
];

export function AdminTabs({ numeros }: { numeros: Record<string, number> }) {
  const [ativa, setAtiva] = useState("overview");
  useEffect(() => {
    const painel = document.querySelector<HTMLElement>(".admin-dashboard");
    if (painel) painel.dataset.adminTab = ativa;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [ativa]);

  return <nav className="admin-dashboard-nav" aria-label="Áreas do painel">{abas.map((aba) => <button type="button" key={aba.id} className={ativa === aba.id ? "active" : ""} onClick={() => setAtiva(aba.id)} aria-pressed={ativa === aba.id}><i>{aba.icone}</i><span>{aba.nome}</span>{aba.id !== "overview" && <b>{numeros[aba.id] ?? 0}</b>}</button>)}</nav>;
}
