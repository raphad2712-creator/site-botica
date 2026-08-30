"use client";

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
  const [ordem, setOrdem] = useState("relevancia");
  const [newsletterMensagem, setNewsletterMensagem] = useState("");
  const [newsletterEnviando, setNewsletterEnviando] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inicial = params.get("categoria");
    if (inicial && categorias.includes(inicial)) setCategoria(inicial);
    const termo = params.get("busca");
    if (termo) setBusca(termo);
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible")),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".scroll-reveal").forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const filtrados = useMemo(() => produtos.filter((produto) => {
    const correspondeCategoria = categoria === "Todos" || produto.categoria.toLowerCase() === categoria.toLowerCase();
    const texto = `${produto.nome} ${produto.descricao} ${produto.categoria}`.toLowerCase();
    return correspondeCategoria && texto.includes(busca.toLowerCase());
  }).sort((a, b) => ordem === "menor" ? Number(a.preco) - Number(b.preco) : ordem === "maior" ? Number(b.preco) - Number(a.preco) : ordem === "nome" ? a.nome.localeCompare(b.nome) : a.id - b.id), [produtos, categoria, busca, ordem]);

  async function cadastrarNewsletter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newsletterEnviando) return;
    const formulario = event.currentTarget;
    const email = String(new FormData(formulario).get("email") ?? "");
    setNewsletterEnviando(true);
    setNewsletterMensagem("");
    try {
      const resposta = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const dados = await resposta.json();
      setNewsletterMensagem(dados.mensagem ?? dados.erro ?? "Não foi possível cadastrar.");
      if (resposta.ok) formulario.reset();
    } catch {
      setNewsletterMensagem("Não foi possível cadastrar agora. Tente novamente.");
    } finally {
      setNewsletterEnviando(false);
    }
  }

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-eyebrow"><i /> FARMÁCIA DE MANIPULAÇÃO & PRODUTOS NATURAIS</span>
          <h1>Seu cuidado, do seu jeito.</h1>
          <p>
            Fórmulas personalizadas, suplementos e dermocosméticos com qualidade
            e acompanhamento farmacêutico.
          </p>
          <div className="hero-actions"><a href="#produtos">COMPRAR AGORA</a><a className="hero-secondary" href="#receita">ENVIAR RECEITA</a></div>
          <div className="hero-assurances"><span>✓ Compra protegida</span><span>✓ Atendimento farmacêutico</span><span>✓ Entrega para todo o Brasil</span></div>
        </div>
        <div className="hero-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/botica-hero-v2.png" alt="Frascos, plantas e utensílios de uma farmácia de manipulação" />
        </div>
      </section>

      <section className="trust-row scroll-reveal">
        <article><b><svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Zm-3 9 2 2 4-4" /></svg></b><span><strong>Compra 100% segura</strong><small>Seus dados sempre protegidos</small></span></article>
        <article><b><svg viewBox="0 0 24 24"><path d="M3 7h11v10H3zM14 10h4l3 3v4h-7M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></svg></b><span><strong>Frete grátis</strong><small>Nas compras a partir de R$ 210</small></span></article>
        <article><b><svg viewBox="0 0 24 24"><path d="M4 6h16v12H4zM4 10h16M8 15h3" /></svg></b><span><strong>Até 6x sem juros</strong><small>Mais facilidade para cuidar de você</small></span></article>
        <article><b><svg viewBox="0 0 24 24"><path d="M5 11a7 7 0 0 1 14 0v5M5 13H3v4h4v-4H5ZM19 13h2v4h-4v-4h2ZM17 19c-1 1-2.7 2-5 2" /></svg></b><span><strong>Atendimento humano</strong><small>Conte com a nossa equipe</small></span></article>
      </section>

      <section className="objectives scroll-reveal" id="objetivos">
        <div className="title">
          <small>LINHAS DA BOTICA</small>
          <h2>Compre por categoria</h2>
          <p>Cada linha reúne fórmulas e produtos pensados para um objetivo.</p>
        </div>
        <div className="objective-grid">
          {categorias.slice(1).map((item) => (
            <button className={categoria === item ? "active" : ""} key={item} onClick={() => { setCategoria(item); document.querySelector("#produtos")?.scrollIntoView(); }} aria-pressed={categoria === item}>
              <i><svg viewBox="0 0 24 24"><path d={icones[item]} /></svg></i>
              <b>{item}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="catalog scroll-reveal" id="produtos">
        <div className="catalog-head"><div><small>PRODUTOS BOTICA BIOENERGÉTICA</small><h2>{categoria === "Todos" ? "Encontre o cuidado ideal" : categoria}</h2><p>{filtrados.length} {filtrados.length === 1 ? "produto encontrado" : "produtos encontrados"}</p></div></div>
        <div className="catalog-tools">
          <label className="catalog-search"><span>⌕</span><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Busque por produto ou objetivo" aria-label="Buscar produtos" />{busca && <button onClick={() => setBusca("")} aria-label="Limpar busca">×</button>}</label>
          <label className="catalog-sort"><span>Ordenar por</span><select value={ordem} onChange={(e) => setOrdem(e.target.value)}><option value="relevancia">Mais relevantes</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option><option value="nome">Nome A–Z</option></select></label>
        </div>
        <div className="category-tabs">
          {categorias.map((item) => <button key={item} className={categoria === item ? "active" : ""} onClick={() => setCategoria(item)}>{item}</button>)}
        </div>
        {erro ? <div className="notice error">Não foi possível carregar os produtos agora. Tente novamente em instantes.</div> : filtrados.length ? <div className="products">{filtrados.map((produto) => <ProductCard key={produto.id} produto={produto} />)}</div> : <div className="catalog-empty"><b>Nenhum produto encontrado</b><p>Tente outro termo ou volte a visualizar todo o catálogo.</p><button onClick={() => { setBusca(""); setCategoria("Todos"); }}>VER TODOS OS PRODUTOS</button></div>}
      </section>

      <section className="campaign scroll-reveal"><div><small>CUIDADO COMPLETO</small><h2>Seu bem-estar começa com escolhas melhores.</h2><p>Encontre suplementos, vitaminas e dermocosméticos selecionados para a sua rotina.</p><a href="#produtos">CONHECER PRODUTOS</a></div></section>
      <section className="rx scroll-reveal" id="receita"><div><small>MANIPULAÇÃO PERSONALIZADA</small><h2>Tem uma receita?</h2><p>Envie sua prescrição. Nossa equipe analisa e entra em contato com o orçamento.</p><ol><li><b>1</b> Envie a receita</li><li><b>2</b> Receba o orçamento</li><li><b>3</b> Aprove seu pedido</li></ol></div><form className="rx-form" onSubmit={(e) => { e.preventDefault(); alert("Receita recebida para demonstração."); }}><span>⇧</span><h3>Envie sua receita</h3><p>PDF, JPG ou PNG • até 10 MB</p><label>SELECIONAR ARQUIVO<input type="file" accept="image/*,.pdf" required /></label><button>SOLICITAR ORÇAMENTO</button></form></section>
      <section className="newsletter scroll-reveal"><div><small>NOVIDADES DA BOTICA</small><h2>Cuide-se com informação.</h2><p>Receba novidades, conteúdos e ofertas da Botica no seu e-mail.</p></div><form onSubmit={cadastrarNewsletter}><input name="email" type="email" placeholder="Seu melhor e-mail" required disabled={newsletterEnviando} /><button disabled={newsletterEnviando}>{newsletterEnviando ? "CADASTRANDO..." : "QUERO RECEBER"}</button>{newsletterMensagem && <p className="newsletter-message" role="status">{newsletterMensagem}</p>}<small>Ao cadastrar, você concorda em receber comunicações da Botica. É possível cancelar quando quiser.</small></form></section>
    </>
  );
}
