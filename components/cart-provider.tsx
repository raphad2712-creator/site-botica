"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ItemCarrinho, Produto } from "@/lib/types";

type CartContextValue = {
  itens: ItemCarrinho[];
  totalItens: number;
  total: number;
  adicionar: (produto: Produto, quantidade?: number) => void;
  alterarQuantidade: (id: number, quantidade: number) => void;
  remover: (id: number) => void;
  limpar: () => void;
  abrirCarrinho: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [pronto, setPronto] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    try {
      const salvo = localStorage.getItem("botica-carrinho");
      if (salvo) setItens(JSON.parse(salvo));
    } finally { setPronto(true); }
  }, []);
  useEffect(() => { if (pronto) localStorage.setItem("botica-carrinho", JSON.stringify(itens)); }, [itens, pronto]);
  useEffect(() => { document.body.style.overflow = aberto ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [aberto]);

  function adicionar(produto: Produto, quantidade = 1) {
    setItens((atuais) => {
      const existente = atuais.find((item) => item.id === produto.id);
      return existente
        ? atuais.map((item) => item.id === produto.id ? { ...item, quantidade: item.quantidade + quantidade } : item)
        : [...atuais, { ...produto, quantidade }];
    });
    setAviso(`${produto.nome} foi adicionado.`);
    window.setTimeout(() => setAviso(""), 2300);
    setAberto(true);
  }
  function alterarQuantidade(id: number, quantidade: number) {
    if (quantidade < 1) return remover(id);
    setItens((atuais) => atuais.map((item) => item.id === id ? { ...item, quantidade } : item));
  }
  function remover(id: number) { setItens((atuais) => atuais.filter((item) => item.id !== id)); }

  const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);
  const total = itens.reduce((soma, item) => soma + Number(item.preco) * item.quantidade, 0);
  const value = useMemo(() => ({ itens, totalItens, total, adicionar, alterarQuantidade, remover, limpar: () => setItens([]), abrirCarrinho: () => setAberto(true) }), [itens, totalItens, total]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <div className={`cart-drawer-backdrop ${aberto ? "open" : ""}`} onClick={() => setAberto(false)} />
      <aside className={`cart-drawer ${aberto ? "open" : ""}`} aria-hidden={!aberto}>
        <div className="drawer-head"><div><h2>Carrinho</h2><small>{totalItens} {totalItens === 1 ? "item" : "itens"} no carrinho</small></div><button onClick={() => setAberto(false)}>×</button></div>
        <div className="drawer-items">
          {!itens.length && <div className="drawer-empty"><b>Sua sacola está vazia</b><p>Adicione produtos para continuar.</p><a href="/#produtos" onClick={() => setAberto(false)}>VER PRODUTOS</a></div>}
          {itens.map((item) => (
            <article className="drawer-item" key={item.id}>
              <Link href={`/produto/${item.id}`} onClick={() => setAberto(false)} className="drawer-image">
                {item.imagem_url ? <img src={item.imagem_url} alt={item.nome} /> : <div className="mini-jar"><i /><b>BOTICA</b><small>{item.categoria}</small></div>}
              </Link>
              <div className="drawer-item-copy"><Link href={`/produto/${item.id}`} onClick={() => setAberto(false)}><b>{item.nome}</b></Link><small>{item.categoria}</small><strong>{moeda(Number(item.preco))}</strong><button onClick={() => remover(item.id)}>Remover</button></div>
              <div className="drawer-quantity"><button onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}>−</button><b>{item.quantidade}</b><button onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}>+</button></div>
            </article>
          ))}
        </div>
        {!!itens.length && <div className="drawer-footer"><div><span>Subtotal</span><b>{moeda(total)}</b></div><small>Frete calculado na finalização da compra.</small><Link href="/checkout" onClick={() => setAberto(false)}>FINALIZAR COMPRA</Link><Link className="view-cart" href="/carrinho" onClick={() => setAberto(false)}>Ver carrinho completo</Link></div>}
      </aside>
      <div className={`cart-toast ${aviso ? "show" : ""}`} role="status"><span>✓</span><div><b>Produto adicionado!</b><small>{aviso}</small></div></div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de CartProvider");
  return context;
}
