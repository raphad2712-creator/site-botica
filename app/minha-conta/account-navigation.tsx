"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui-icon";

export function AccountNavigation({ pedidos, solicitacoes }: { pedidos: number; solicitacoes: number }) {
  const [aba, setAba] = useState("orders");
  useEffect(() => {
    const conta = document.querySelector<HTMLElement>(".account-dashboard");
    if (conta) conta.dataset.accountTab = aba;
    if (aba !== "orders") document.querySelector(".account-main")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [aba]);

  return <nav aria-label="Opções da conta">
    <button type="button" className={aba === "orders" ? "active" : ""} onClick={() => setAba("orders")}><i><Icon name="document" /></i><span>Meus pedidos</span><em>{pedidos}</em><b><Icon name="arrow-right" /></b></button>
    <button type="button" className={aba === "requests" ? "active" : ""} onClick={() => setAba("requests")}><i><Icon name="clock" /></i><span>Minhas solicitações</span><em>{solicitacoes}</em><b><Icon name="arrow-right" /></b></button>
    <button type="button" className={aba === "profile" ? "active" : ""} onClick={() => setAba("profile")}><i><Icon name="document" /></i><span>Dados pessoais</span><b><Icon name="arrow-right" /></b></button>
    <Link href="/#produtos"><i><Icon name="heart" /></i><span>Produtos favoritos</span><b><Icon name="arrow-right" /></b></Link>
    <Link href="/#receita"><i><Icon name="upload" /></i><span>Enviar receita</span><b><Icon name="arrow-right" /></b></Link>
    <Link href="/#produtos"><i><Icon name="search" /></i><span>Continuar comprando</span><b><Icon name="arrow-right" /></b></Link>
  </nav>;
}
