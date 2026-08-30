"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Produto } from "@/lib/types";

type FavoritesContextValue = {
  favoritos: Produto[];
  estaFavorito: (id: number) => boolean;
  alternarFavorito: (produto: Produto) => void;
  abrirFavoritos: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const STORAGE_KEY = "botica-favoritos";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoritos, setFavoritos] = useState<Produto[]>([]);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(STORAGE_KEY);
      if (salvo) setFavoritos(JSON.parse(salvo));
    } catch { /* Navegador sem armazenamento disponível. */ }
  }, []);

  function alternarFavorito(produto: Produto) {
    setFavoritos((atuais) => {
      const existe = atuais.some((item) => item.id === produto.id);
      const novos = existe ? atuais.filter((item) => item.id !== produto.id) : [...atuais, produto];
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(novos)); } catch { /* noop */ }
      return novos;
    });
  }

  const valor = useMemo(() => ({
    favoritos,
    estaFavorito: (id: number) => favoritos.some((item) => item.id === id),
    alternarFavorito,
    abrirFavoritos: () => setAberto(true),
  }), [favoritos]);

  return (
    <FavoritesContext.Provider value={valor}>
      {children}
      {aberto && <button className="favorites-backdrop" onClick={() => setAberto(false)} aria-label="Fechar favoritos" />}
      <aside className={`favorites-drawer ${aberto ? "open" : ""}`} aria-hidden={!aberto}>
        <header><div><small>SALVOS PARA DEPOIS</small><h2>Meus favoritos</h2></div><button onClick={() => setAberto(false)} aria-label="Fechar">×</button></header>
        {favoritos.length ? <div className="favorites-list">{favoritos.map((produto) => (
          <article key={produto.id}>
            <Link href={`/produto/${produto.id}`} onClick={() => setAberto(false)}>
              {produto.imagem_url ? <img src={produto.imagem_url} alt="" /> : <span>BOTICA</span>}
            </Link>
            <div><small>{produto.categoria}</small><Link href={`/produto/${produto.id}`} onClick={() => setAberto(false)}>{produto.nome}</Link><b>{Number(produto.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</b></div>
            <button onClick={() => alternarFavorito(produto)} aria-label={`Remover ${produto.nome} dos favoritos`}>×</button>
          </article>
        ))}</div> : <div className="favorites-empty"><span>♡</span><h3>Sua lista está vazia</h3><p>Toque no coração de um produto para encontrá-lo facilmente depois.</p><button onClick={() => { setAberto(false); window.location.href = "/#produtos"; }}>VER PRODUTOS</button></div>}
      </aside>
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const contexto = useContext(FavoritesContext);
  if (!contexto) throw new Error("useFavorites deve ser usado dentro de FavoritesProvider");
  return contexto;
}
