"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function AccountNavigation({ pedidos, solicitacoes }: { pedidos: number; solicitacoes: number }) {
  const [aba, setAba] = useState("orders");
  useEffect(() => {
    const conta = document.querySelector<HTMLElement>(".account-dashboard");
    if (conta) conta.dataset.accountTab = aba;
    if (aba !== "orders") document.querySelector(".account-main")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [aba]);

  return <nav aria-label="Opções da conta">
    <button type="button" className={aba === "orders" ? "active" : ""} onClick={() => setAba("orders")}><i>▣</i><span>Meus pedidos</span><em>{pedidos}</em><b>›</b></button>
    <button type="button" className={aba === "requests" ? "active" : ""} onClick={() => setAba("requests")}><i>↻</i><span>Minhas solicitações</span><em>{solicitacoes}</em><b>›</b></button>
    <button type="button" className={aba === "profile" ? "active" : ""} onClick={() => setAba("profile")}><i>♙</i><span>Dados pessoais</span><b>›</b></button>
    <Link href="/#produtos"><i>♡</i><span>Produtos favoritos</span><b>›</b></Link>
    <Link href="/#receita"><i>＋</i><span>Enviar receita</span><b>›</b></Link>
    <Link href="/#produtos"><i>⌕</i><span>Continuar comprando</span><b>›</b></Link>
  </nav>;
}
