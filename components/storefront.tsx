"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { Produto } from "@/lib/types";
import { ProductCard } from "./product-card";

const categorias = ["Todos", "Academia", "Sono", "Florais", "Vitaminas", "Emagrecimento", "Beleza"];
const icones: Record<string, string> = {
  Academia: "M5 9v6M2.5 10.5v3M19 9v6M21.5 10.5v3M5 12h14",
  Sono: "M20 15.2A8 8 0 0 1 8.8 4 8.2 8.2 0 1 0 20 15.2Z",
  Florais: "M12 9.8C9.5 7.1 9.8 4.6 12 3c2.2 1.6 2.5 4.1 0 6.8M14.2 12c2.7-2.5 5.2-2.2 6.8 0-1.6 2.2-4.1 2.5-6.8 0M12 14.2c2.5 2.7 2.2 5.2 0 6.8-2.2-1.6-2.5-4.1 0-6.8M9.8 12C7.1 14.5 4.6 14.2 3 12c1.6-2.2 4.1-2.5 6.8 0",
  Vitaminas: "M8.2 5.2a4.2 4.2 0 0 1 6 0l4.6 4.6a4.2 4.2 0 0 1-6 6l-4.6-4.6a4.2 4.2 0 0 1 0-6ZM9.7 12.7l5-5",
  Emagrecimento: "M5 20h14a2 2 0 0 0 2-2V8a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v10a2 2 0 0 0 2 2ZM8 8a4 4 0 0 1 8 0M12 8l2-2",
  Beleza: "M12 3c1.1 3.5 2.5 4.9 6 6-3.5 1.1-4.9 2.5-6 6-1.1-3.5-2.5-4.9-6-6 3.5-1.1 4.9-2.5 6-6Z",
};

export function Storefront({ produtos, erro }: { produtos: Produto[]; erro?: string }) {
  const [categoria, setCategoria] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inicial = params.get("categoria");
    if (inicial && categorias.includes(inicial)) setCategoria(inicial);
    const termo = params.get("busca");
    if (termo) setBusca(termo);
    const timer = window.setTimeout(() => setSplash(false), 1150);
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible")),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".scroll-reveal").forEach((item) => observer.observe(item));
    return () => { window.clearTimeout(timer); observer.disconnect(); };
  }, []);

  const filtrados = useMemo(() => produtos.filter((produto) => {
    const correspondeCategoria = categoria === "Todos" || produto.categoria.toLowerCase() === categoria.toLowerCase();
    const texto = `${produto.nome} ${produto.descricao} ${produto.categoria}`.toLowerCase();
    return correspondeCategoria && texto.includes(busca.toLowerCase());
  }), [produtos, categoria, busca]);

  return (
    <>
      <div className={`splash ${splash ? "" : "hidden"}`} aria-hidden={!splash}>
        <Image src="/botica-logo-nova.jpeg" alt="Botica Bioenergética" width={384} height={114} priority />
      </div>

      <section className="hero">
        <div className="hero-copy">
          <span>FARMÁCIA DE MANIPULAÇÃO</span>
          <h1>Cuidado feito para o seu momento.</h1>
          <p>
            Fórmulas personalizadas, suplementos e dermocosméticos com qualidade
            e acompanhamento farmacêutico.
          </p>
          <a href="#produtos">COMPRAR AGORA</a>
        </div>
        <div className="hero-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/botica-hero.png" alt="Produtos naturais e fórmulas da Botica" />
        </div>
      </section>

      <section className="trust-row scroll-reveal">
        <article><b>✓</b><span><strong>Compra 100% segura</strong><small>Seus dados protegidos</small></span></article>
        <article><b>↗</b><span><strong>Frete grátis</strong><small>A partir de R$ 210</small></span></article>
        <article><b>6x</b><span><strong>Até 6x sem juros</strong><small>Parcela mínima de R$ 30</small></span></article>
        <article><b>?</b><span><strong>Precisa de ajuda?</strong><small>Fale com a nossa equipe</small></span></article>
      </section>

      <section className="objectives scroll-reveal" id="objetivos">
        <div className="title">
          <small>LINHAS DA BOTICA</small>
          <h2>Compre por categoria</h2>
          <p>Cada linha reúne fórmulas e produtos pensados para um objetivo.</p>
        </div>
        <div className="objective-grid">
          {categorias.slice(1).map((item) => (
            <button key={item} onClick={() => { setCategoria(item); document.querySelector("#produtos")?.scrollIntoView(); }}>
              <i><svg viewBox="0 0 24 24"><path d={icones[item]} /></svg></i>
              <b>{item}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="catalog scroll-reveal" id="produtos">
        <div className="catalog-head"><div><small>PRODUTOS BOTICA BIOENERGÉTICA</small><h2>{categoria === "Todos" ? "Todos os produtos" : categoria}</h2></div></div>
        <label className="catalog-search"><span>⌕</span><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar no catálogo" /></label>
        <div className="category-tabs">
          {categorias.map((item) => <button key={item} className={categoria === item ? "active" : ""} onClick={() => setCategoria(item)}>{item}</button>)}
        </div>
        {erro ? <div className="notice error">Conecte o Supabase para carregar os produtos: {erro}</div> : filtrados.length ? <div className="products">{filtrados.map((produto) => <ProductCard key={produto.id} produto={produto} />)}</div> : <div className="notice">Nenhum produto encontrado nessa categoria.</div>}
      </section>

      <section className="campaign scroll-reveal"><div><small>CUIDADO COMPLETO</small><h2>Seu bem-estar começa com escolhas melhores.</h2><p>Encontre suplementos, vitaminas e dermocosméticos selecionados para a sua rotina.</p><a href="#produtos">CONHECER PRODUTOS</a></div></section>
      <section className="rx scroll-reveal" id="receita"><div><small>MANIPULAÇÃO PERSONALIZADA</small><h2>Tem uma receita?</h2><p>Envie sua prescrição. Nossa equipe analisa e entra em contato com o orçamento.</p><ol><li><b>1</b> Envie a receita</li><li><b>2</b> Receba o orçamento</li><li><b>3</b> Aprove seu pedido</li></ol></div><form className="rx-form" onSubmit={(e) => { e.preventDefault(); alert("Receita recebida para demonstração."); }}><span>⇧</span><h3>Envie sua receita</h3><p>PDF, JPG ou PNG • até 10 MB</p><label>SELECIONAR ARQUIVO<input type="file" accept="image/*,.pdf" required /></label><button>SOLICITAR ORÇAMENTO</button></form></section>
      <section className="newsletter scroll-reveal"><div><small>NOVIDADES DA BOTICA</small><h2>Cuide-se com informação.</h2></div><form onSubmit={(e) => { e.preventDefault(); alert("E-mail cadastrado com sucesso."); }}><input type="email" placeholder="Seu melhor e-mail" required /><button>CADASTRAR</button></form></section>
    </>
  );
}
