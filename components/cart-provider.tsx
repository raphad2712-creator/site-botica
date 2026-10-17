"use client";

import { lerProdutosSalvos } from "@/lib/stored-products";
import { useDrawer } from "./use-drawer";
import { Icon } from "@/components/ui-icon";


import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ItemCarrinho, Produto } from "@/lib/types";
import { criarClienteSupabase } from "@/lib/supabase/client";
import { ProductImage } from "./product-image";

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

  const drawer = useDrawer(aberto, () => setAberto(false));

  useEffect(() => {
    try {
      const salvo = localStorage.getItem("botica-carrinho");
      setItens(lerProdutosSalvos(salvo, true));
    } catch { /* A compra também funciona sem armazenamento local. */ } finally { setPronto(true); }
  }, []);
  useEffect(() => { if (pronto) { try { localStorage.setItem("botica-carrinho", JSON.stringify(itens)); } catch { /* Carrinho mantido em memória. */ } } }, [itens, pronto]);
  useEffect(() => {
    const supabase = criarClienteSupabase();
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") {
        setItens([]);
        setAberto(false);
        try { localStorage.removeItem("botica-carrinho"); } catch { /* noop */ }
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);


  function adicionar(produto: Produto, quantidade = 1) {
    if (!Number.isSafeInteger(quantidade) || quantidade < 1 || produto.estoque < 1) return;
    const limite = Math.min(100, produto.estoque);
    setItens((atuais) => {
      const existente = atuais.find((item) => item.id === produto.id);
      return existente
        ? atuais.map((item) => item.id === produto.id ? { ...produto, quantidade: Math.min(limite, item.quantidade + quantidade) } : item)
        : [...atuais, { ...produto, quantidade: Math.min(limite, quantidade) }];
    });
    setAviso(`${produto.nome} foi adicionado.`);
    window.setTimeout(() => setAviso(""), 2300);
    setAberto(true);
  }
  function alterarQuantidade(id: number, quantidade: number) {
    if (!Number.isSafeInteger(quantidade)) return;
    if (quantidade < 1) return remover(id);
    setItens((atuais) => atuais.map((item) => item.id === id ? { ...item, quantidade: Math.min(100, item.estoque, quantidade) } : item));
  }
  function remover(id: number) { setItens((atuais) => atuais.filter((item) => item.id !== id)); }

  const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);
  const total = itens.reduce((soma, item) => soma + Number(item.preco) * item.quantidade, 0);
  const value = useMemo(() => ({ itens, totalItens, total, adicionar, alterarQuantidade, remover, limpar: () => setItens([]), abrirCarrinho: () => setAberto(true) }), [itens, totalItens, total]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <div className={`cart-drawer-backdrop ${aberto ? "open" : ""}`} onClick={() => setAberto(false)} />
      <aside ref={drawer} className={`cart-drawer ${aberto ? "open" : ""}`} role="dialog" aria-modal={aberto || undefined} aria-labelledby="cart-title" aria-hidden={!aberto} inert={!aberto} tabIndex={-1}>
        <div className="drawer-head"><div><h2 id="cart-title">Carrinho</h2><small>{totalItens} {totalItens === 1 ? "item" : "itens"} no carrinho</small></div><button onClick={() => setAberto(false)} aria-label="Fechar carrinho">×</button></div>
        {!!itens.length && <div className={`free-shipping ${total >= 210 ? "complete" : ""}`}><span>{total >= 210 ? "Você ganhou frete grátis" : `Faltam ${moeda(210 - total)} para o frete grátis`}</span><div><i style={{ "--progress": `${Math.min(100, total / 2.1)}%` } as React.CSSProperties} /><b>{Math.min(100, Math.round(total / 2.1))}%</b></div></div>}
        <div className="drawer-items">
          {!itens.length && <div className="drawer-empty"><b>Sua sacola está vazia</b><p>Adicione produtos para continuar.</p><a href="/#produtos" onClick={() => setAberto(false)}>VER PRODUTOS</a></div>}
          {itens.map((item) => (
            <article className="drawer-item" key={item.id}>
              <Link href={`/produto/${item.id}`} onClick={() => setAberto(false)} className="drawer-image">
                <ProductImage nome={item.nome} imagemAtual={item.imagem_url} />
              </Link>
              <div className="drawer-item-copy"><Link href={`/produto/${item.id}`} onClick={() => setAberto(false)}><b>{item.nome}</b></Link><small>{item.categoria}</small><strong>{moeda(Number(item.preco))}</strong><button onClick={() => remover(item.id)}>Remover</button></div>
              <div className="drawer-quantity"><button aria-label={`Diminuir quantidade de ${item.nome}`} onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}>−</button><b>{item.quantidade}</b><button aria-label={`Aumentar quantidade de ${item.nome}`} disabled={item.quantidade >= Math.min(100, item.estoque)} onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}>+</button></div>
            </article>
          ))}
        </div>
        {!!itens.length && <div className="drawer-footer"><div><span>Subtotal</span><b>{moeda(total)}</b></div><small>Frete calculado na finalização da compra.</small><Link href="/checkout" onClick={() => setAberto(false)}>FINALIZAR COMPRA</Link><Link className="view-cart" href="/carrinho" onClick={() => setAberto(false)}>Ver carrinho completo</Link></div>}
      </aside>
      <div className={`cart-toast ${aviso ? "show" : ""}`} role="status"><span><Icon name="check" /></span><div><b>Produto adicionado!</b><small>{aviso}</small></div></div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de CartProvider");
  return context;
}
