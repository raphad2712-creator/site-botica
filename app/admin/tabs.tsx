"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui-icon";

const abas = [
  { id: "overview", icone: "leaf" as const, nome: "Visão geral" },
  { id: "deliveries", icone: "truck" as const, nome: "Pedidos", notificar: true },
  { id: "products", icone: "document" as const, nome: "Produtos" },
  { id: "recipes", icone: "upload" as const, nome: "Receitas", notificar: true },
  { id: "requests", icone: "clock" as const, nome: "Pós-venda", notificar: true },
  { id: "newsletter", icone: "document" as const, nome: "Comunicados" },
];
const prefixo = "admin-";

export function AdminTabs({ numeros }: { numeros: Record<string, number> }) {
  const [ativa, setAtiva] = useState("overview");
  useEffect(() => {
    function selecionarPeloEndereco() {
      const id = window.location.hash.replace(/^#admin-/, "");
      if (abas.some((aba) => aba.id === id)) setAtiva(id);
    }
    selecionarPeloEndereco();
    window.addEventListener("hashchange", selecionarPeloEndereco);
    return () => window.removeEventListener("hashchange", selecionarPeloEndereco);
  }, []);
  useEffect(() => {
    const painel = document.querySelector<HTMLElement>(".admin-dashboard");
    if (painel) painel.dataset.adminTab = ativa;
  }, [ativa]);

  return <nav className="admin-dashboard-nav" aria-label="Áreas do painel">{abas.map((aba) => { const quantidade = numeros[aba.id] ?? 0; return <a href={`#${prefixo}${aba.id}`} key={aba.id} className={ativa === aba.id ? "active" : ""} onClick={() => setAtiva(aba.id)} aria-current={ativa === aba.id ? "page" : undefined}><i><Icon name={aba.icone} /></i><span>{aba.nome}</span>{aba.notificar && quantidade > 0 && <b aria-label={`${quantidade} pendências`}>{quantidade}</b>}</a>; })}</nav>;
}
