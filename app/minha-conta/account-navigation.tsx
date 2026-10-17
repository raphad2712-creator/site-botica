"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui-icon";
import { useFavorites } from "@/components/favorites-provider";

const sections: Record<string, string> = { orders: "pedidos", requests: "solicitacoes", profile: "dados" };
export function AccountNavigation({ pedidos, solicitacoes }: { pedidos: number; solicitacoes: number }) {
  const [aba, setAba] = useState("orders");
  const { abrirFavoritos } = useFavorites();
  useEffect(() => {
    const restaurar = () => setAba(Object.keys(sections).find(key => `#${sections[key]}` === window.location.hash) || "orders");
    restaurar();
    window.addEventListener("hashchange", restaurar);
    return () => window.removeEventListener("hashchange", restaurar);
  }, []);
  useEffect(() => {
    const conta = document.querySelector<HTMLElement>(".account-dashboard");
    if (conta) conta.dataset.accountTab = aba;
  }, [aba]);
  function selecionar(aba: string) {
    setAba(aba);
    window.history.replaceState(window.history.state, "", `#${sections[aba]}`);
    if (window.matchMedia("(max-width: 760px)").matches) document.querySelector(".account-main")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  }
  return <nav aria-label="Opções da conta">
    <button type="button" aria-pressed={aba === "orders"} aria-controls="pedidos" className={aba === "orders" ? "active" : ""} onClick={() => selecionar("orders")}><i><Icon name="document" /></i><span>Meus pedidos</span><em>{pedidos}</em><b><Icon name="arrow-right" /></b></button>
    <button type="button" aria-pressed={aba === "requests"} aria-controls="solicitacoes" className={aba === "requests" ? "active" : ""} onClick={() => selecionar("requests")}><i><Icon name="clock" /></i><span>Minhas solicitações</span><em>{solicitacoes}</em><b><Icon name="arrow-right" /></b></button>
    <button type="button" aria-pressed={aba === "profile"} aria-controls="dados" className={aba === "profile" ? "active" : ""} onClick={() => selecionar("profile")}><i><Icon name="document" /></i><span>Dados pessoais</span><b><Icon name="arrow-right" /></b></button>
    <button type="button" onClick={abrirFavoritos}><i><Icon name="heart" /></i><span>Produtos favoritos</span><b><Icon name="arrow-right" /></b></button>
    <Link href="/#receita"><i><Icon name="upload" /></i><span>Enviar receita</span><b><Icon name="arrow-right" /></b></Link>
    <Link href="/#produtos"><i><Icon name="search" /></i><span>Continuar comprando</span><b><Icon name="arrow-right" /></b></Link>
  </nav>;
}
