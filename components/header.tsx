"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./cart-provider";
import { criarClienteSupabase } from "@/lib/supabase/client";
import { useFavorites } from "./favorites-provider";

export function Header() {
  const { totalItens, abrirCarrinho } = useCart();
  const { favoritos, abrirFavoritos } = useFavorites();
  const [menu, setMenu] = useState(false);
  const [usuario, setUsuario] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    const supabase = criarClienteSupabase();
    supabase.auth.getUser().then(({ data }) => setUsuario(data.user));
    const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => setUsuario(sessao?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

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
          <button className="favorites-header" onClick={abrirFavoritos} aria-label={`Abrir ${favoritos.length} produtos favoritos`}>
            <svg viewBox="0 0 24 24"><path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" /></svg>
            <span>Favoritos</span>{favoritos.length > 0 && <b>{favoritos.length}</b>}
          </button>
          <Link href={usuario ? "/minha-conta" : "/login"} className="account-button" aria-label={usuario ? "Abrir minha conta" : "Entrar ou criar conta"}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 21a7.5 7.5 0 0 1 15 0" /></svg>
            <span>{usuario ? "Minha conta" : "Entrar"}<small>{usuario ? usuario.email?.split("@")[0] : "ou criar conta"}</small></span>
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
        <button onClick={abrirFavoritos} aria-label="Favoritos"><svg viewBox="0 0 24 24"><path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" /></svg><span>Favoritos</span>{favoritos.length > 0 && <b>{favoritos.length}</b>}</button>
        <Link href={usuario ? "/minha-conta" : "/login"} aria-label="Minha conta"><svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 21a7.5 7.5 0 0 1 15 0" /></svg><span>{usuario ? "Conta" : "Entrar"}</span></Link>
        <button onClick={abrirCarrinho} aria-label={`Carrinho com ${totalItens} itens`}><svg viewBox="0 0 24 24"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H7M10 20h.01M18 20h.01" /></svg><span>Carrinho</span>{totalItens > 0 && <b>{totalItens}</b>}</button>
      </nav>
    </>
  );
}
