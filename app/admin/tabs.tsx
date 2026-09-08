"use client";

import { useEffect, useState } from "react";

const abas = [
  { id: "overview", icone: "⌂", nome: "Visão geral" },
  { id: "deliveries", icone: "▤", nome: "Pedidos", notificar: true },
  { id: "products", icone: "▦", nome: "Produtos" },
  { id: "recipes", icone: "＋", nome: "Receitas", notificar: true },
  { id: "requests", icone: "!", nome: "Pós-venda", notificar: true },
  { id: "newsletter", icone: "✉", nome: "Comunicados" },
];

export function AdminTabs({ numeros }: { numeros: Record<string, number> }) {
  const [ativa, setAtiva] = useState("overview");
  useEffect(() => {
    const painel = document.querySelector<HTMLElement>(".admin-dashboard");
    if (painel) painel.dataset.adminTab = ativa;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [ativa]);

  return <nav className="admin-dashboard-nav" aria-label="Áreas do painel">{abas.map((aba) => { const quantidade = numeros[aba.id] ?? 0; return <button type="button" key={aba.id} className={ativa === aba.id ? "active" : ""} onClick={() => setAtiva(aba.id)} aria-pressed={ativa === aba.id}><i>{aba.icone}</i><span>{aba.nome}</span>{aba.notificar && quantidade > 0 && <b aria-label={`${quantidade} pendências`}>{quantidade}</b>}</button>; })}</nav>;
}
