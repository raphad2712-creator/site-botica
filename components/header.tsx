"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "./cart-provider";

export function Header() {
  const { totalItens, abrirCarrinho } = useCart();
  const [menu, setMenu] = useState(false);

  return (
    <>
      <div className="promo"><span>Frete grátis acima de R$ 210</span><span>Até 6x sem juros</span><span>Compra segura</span></div>
      <header>
        <button
          className="hamb"
          onClick={() => setMenu(!menu)}
          aria-label={menu ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menu}
        >
          {menu ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          )}
        </button>
        <Link className="official-logo logo-clean" href="/">
          <Image src="/botica-logo-nova.jpeg" alt="Botica Bioenergética" width={300} height={89} priority />
        </Link>
        <form className="search" action="/#produtos"><span>⌕</span><input name="busca" placeholder="O que você está buscando?" /></form>
        <div className="head-actions">
          <Link href="/login" className="account-button" aria-label="Entrar ou criar conta">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 21a7.5 7.5 0 0 1 15 0" /></svg>
            <span>Entrar<small>ou criar conta</small></span>
          </Link>
          <button className="cart-simple" onClick={abrirCarrinho} aria-label="Abrir carrinho">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H7M10 20h.01M18 20h.01" /></svg>
            <span>Carrinho</span><b>{totalItens}</b>
          </button>
        </div>
      </header>
      <nav className={`nav ${menu ? "open" : ""}`}>
        <a href="/#produtos" onClick={() => setMenu(false)}>Todos os produtos</a><a href="/?categoria=Emagrecimento#produtos" onClick={() => setMenu(false)}>Emagrecimento</a><a href="/?categoria=Academia#produtos" onClick={() => setMenu(false)}>Desempenho físico</a><a href="/?categoria=Vitaminas#produtos" onClick={() => setMenu(false)}>Saúde</a><a href="/?categoria=Beleza#produtos" onClick={() => setMenu(false)}>Queda capilar</a><a href="/?categoria=Beleza#produtos" onClick={() => setMenu(false)}>Beleza</a><a href="/#receita" onClick={() => setMenu(false)}>Envie sua receita</a>
      </nav>
      <nav className="mobile-bottom-nav" aria-label="Navegação rápida">
        <Link href="/" aria-label="Início"><svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5M5.5 10v10h13V10M9.5 20v-6h5v6" /></svg><span>Início</span></Link>
        <Link href="/#produtos" aria-label="Produtos"><svg viewBox="0 0 24 24"><path d="M4 7h16M6 7l1 13h10l1-13M9 7V4h6v3M9 11h6" /></svg><span>Produtos</span></Link>
        <Link href="/login" aria-label="Minha conta"><svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 21a7.5 7.5 0 0 1 15 0" /></svg><span>Conta</span></Link>
        <button onClick={abrirCarrinho} aria-label={`Carrinho com ${totalItens} itens`}><svg viewBox="0 0 24 24"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H7M10 20h.01M18 20h.01" /></svg><span>Carrinho</span>{totalItens > 0 && <b>{totalItens}</b>}</button>
      </nav>
    </>
  );
}
