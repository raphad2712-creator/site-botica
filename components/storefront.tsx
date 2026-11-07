"use client";

import Image from "next/image";
import { Icon } from "@/components/ui-icon";


import { useEffect, useMemo, useState } from "react";
import type { Produto } from "@/lib/types";
import { ProductCard } from "./product-card";
import { CampaignCarousel } from "./campaign-carousel";
import { ConsultationProductCard } from "./consultation-product-card";
import { buildCatalog, filterCatalog, isConsultation, type CatalogProduct } from "@/lib/catalog";

const categorias = ["Naturais", "Academia", "Sono", "Florais", "Vitaminas", "Emagrecimento", "Beleza"];
const icones: Record<string, string> = {
  Naturais: "M20 4c-8-1-15 2-15 8a6 6 0 0 0 6 6c6 0 9-7 9-14ZM4 21 15 10",
  Academia: "M5 9v6M2.5 10.5v3M19 9v6M21.5 10.5v3M5 12h14",
  Sono: "M20 15.2A8 8 0 0 1 8.8 4 8.2 8.2 0 1 0 20 15.2Z",
  Florais: "M12 9.8C9.5 7.1 9.8 4.6 12 3c2.2 1.6 2.5 4.1 0 6.8M14.2 12c2.7-2.5 5.2-2.2 6.8 0-1.6 2.2-4.1 2.5-6.8 0M12 14.2c2.5 2.7 2.2 5.2 0 6.8-2.2-1.6-2.5-4.1 0-6.8M9.8 12C7.1 14.5 4.6 14.2 3 12c1.6-2.2 4.1-2.5 6.8 0",
  Vitaminas: "M8.2 5.2a4.2 4.2 0 0 1 6 0l4.6 4.6a4.2 4.2 0 0 1-6 6l-4.6-4.6a4.2 4.2 0 0 1 0-6ZM9.7 12.7l5-5",
  Emagrecimento: "M5 20h14a2 2 0 0 0 2-2V8a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v10a2 2 0 0 0 2 2ZM8 8a4 4 0 0 1 8 0M12 8l2-2",
  Beleza: "M12 3c1.1 3.5 2.5 4.9 6 6-3.5 1.1-4.9 2.5-6 6-1.1-3.5-2.5-4.9-6-6 3.5-1.1 4.9-2.5 6-6Z",
};

function CatalogCard({ produto }: { produto: CatalogProduct }) {
  return isConsultation(produto)
    ? <ConsultationProductCard produto={produto} />
    : <ProductCard produto={produto} />;
}

export function Storefront({ produtos, erro }: { produtos: Produto[]; erro?: string }) {
  const [categoria, setCategoria] = useState("Naturais");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("relevancia");
  const [filtrosProntos, setFiltrosProntos] = useState(false);
  const [newsletterMensagem, setNewsletterMensagem] = useState("");
  const [newsletterEnviando, setNewsletterEnviando] = useState(false);
  const [receitaArquivo, setReceitaArquivo] = useState("");
  const [receitaMensagem, setReceitaMensagem] = useState("");
  const [receitaEnviando, setReceitaEnviando] = useState(false);
  useEffect(() => {
    const restaurarFiltros = () => {
      const params = new URLSearchParams(window.location.search);
      const inicial = params.get("categoria");
      setCategoria(inicial && categorias.includes(inicial) ? inicial : "Naturais");
      setBusca((params.get("busca") || "").slice(0, 120));
      const ordenacao = params.get("ordem") || "relevancia";
      setOrdem(["menor", "maior", "nome"].includes(ordenacao) ? ordenacao : "relevancia");
      setFiltrosProntos(true);
    };
    restaurarFiltros();
    window.addEventListener("popstate", restaurarFiltros);
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible", "is-visible")),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".scroll-reveal").forEach((item) => observer.observe(item));
    return () => { observer.disconnect(); window.removeEventListener("popstate", restaurarFiltros); };
  }, []);

  useEffect(() => {
    if (!filtrosProntos) return;
    const timer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("categoria", categoria);
      if (busca) url.searchParams.set("busca", busca); else url.searchParams.delete("busca");
      if (ordem !== "relevancia") url.searchParams.set("ordem", ordem); else url.searchParams.delete("ordem");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [categoria, busca, ordem, filtrosProntos]);

  const catalogo = useMemo(() => buildCatalog(produtos), [produtos]);
  const filtrados = useMemo(() => filterCatalog(catalogo, busca.trim() ? "Todos" : categoria, busca, ordem), [catalogo, categoria, busca, ordem]);

  async function cadastrarNewsletter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newsletterEnviando) return;
    const formulario = event.currentTarget;
    const dadosFormulario = new FormData(formulario);
    const email = String(dadosFormulario.get("email") ?? "");
    const consentimento = dadosFormulario.get("consentimento") === "sim";
    setNewsletterEnviando(true);
    setNewsletterMensagem("");
    try {
      const resposta = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, consentimento }) });
      const dados = await resposta.json();
      setNewsletterMensagem(dados.mensagem ?? dados.erro ?? "Não foi possível cadastrar.");
      if (resposta.ok) formulario.reset();
    } catch {
      setNewsletterMensagem("Não foi possível cadastrar agora. Tente novamente.");
    } finally {
      setNewsletterEnviando(false);
    }
  }

  async function enviarReceita(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (receitaEnviando) return;
    const formulario = event.currentTarget; const dados = new FormData(formulario);
    const arquivo = dados.get("arquivo") as File | null;
    if (!arquivo?.size) return setReceitaMensagem("Selecione sua receita em PDF, JPG ou PNG.");
    if (arquivo.size > 10 * 1024 * 1024) return setReceitaMensagem("O arquivo deve ter no máximo 10 MB.");
    setReceitaEnviando(true); setReceitaMensagem("Enviando sua receita com segurança...");
    try {
      const resposta = await fetch("/api/receitas", { method: "POST", credentials: "same-origin", body: dados });
      const retorno = await resposta.json();
      if (resposta.status === 401) { window.location.assign("/login?next=/#receita"); return; }
      setReceitaMensagem(retorno.mensagem || retorno.erro || "Não foi possível enviar.");
      if (resposta.ok) { formulario.reset(); setReceitaArquivo(""); }
    } catch { setReceitaMensagem("Não foi possível conectar. Tente novamente."); }
    finally { setReceitaEnviando(false); }
  }

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-eyebrow"><i /> FARMÁCIA DE MANIPULAÇÃO & PRODUTOS NATURAIS</span>
          <h1>Seu cuidado,<br /><em>do seu jeito.</em></h1>
          <p>
            Fórmulas personalizadas, suplementos e dermocosméticos com qualidade
            e acompanhamento farmacêutico.
          </p>
          <div className="hero-actions"><a href="#produtos">COMPRAR AGORA</a><a className="hero-secondary" href="#receita">ENVIAR RECEITA</a></div>
          <div className="hero-assurances"><span><Icon name="shield" /> Compra protegida</span><span><Icon name="check" /> Atendimento farmacêutico</span><span><Icon name="check" /> Entrega para todo o Brasil</span></div>
        </div>
        <div className="hero-img">
          <Image priority width={1698} height={926} sizes="(max-width: 760px) 100vw, 55vw" src="/botica-hero-v2.png" alt="Frascos, plantas e utensílios de uma farmácia de manipulação" />
        </div>
      </section>

      <section className="trust-row scroll-reveal">
        <article><b><svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Zm-3 9 2 2 4-4" /></svg></b><span><strong>Pagamento protegido</strong><small>Finalização pelo PagBank</small></span></article>
        <article><b><svg viewBox="0 0 24 24"><path d="M3 7h11v10H3zM14 10h4l3 3v4h-7M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></svg></b><span><strong>Frete grátis</strong><small>Nas compras a partir de R$ 210</small></span></article>
        <article><b><svg viewBox="0 0 24 24"><path d="M4 6h16v12H4zM4 10h16M8 15h3" /></svg></b><span><strong>Até 6x sem juros</strong><small>Mais facilidade para cuidar de você</small></span></article>
        <article><b><svg viewBox="0 0 24 24"><path d="M5 11a7 7 0 0 1 14 0v5M5 13H3v4h4v-4H5ZM19 13h2v4h-4v-4h2ZM17 19c-1 1-2.7 2-5 2" /></svg></b><span><strong>Atendimento humano</strong><small>Conte com a nossa equipe</small></span></article>
      </section>

      <section className="objectives scroll-reveal" id="objetivos">
        <div className="title">
          <small>LINHAS DA BOTICA</small>
          <h2>Compre por categoria</h2>
          <p>Escolha uma categoria para encontrar os produtos disponíveis.</p>
        </div>
        <div className="objective-grid">
          {categorias.map((item) => (
            <button className={!busca && categoria === item ? "active" : ""} key={item} onClick={() => { setBusca(""); setCategoria(item); document.querySelector("#produtos")?.scrollIntoView(); }} aria-pressed={!busca && categoria === item}>
              <i><svg viewBox="0 0 24 24"><path d={icones[item]} /></svg></i>
              <b>{item}</b><small>{filterCatalog(catalogo, item, "", "relevancia").length || "Em breve"}{filterCatalog(catalogo, item, "", "relevancia").length > 0 ? (filterCatalog(catalogo, item, "", "relevancia").length === 1 ? " produto" : " produtos") : ""}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="catalog scroll-reveal" id="produtos">
        <div className="catalog-head"><div><small>BOTICA BIOENERGÉTICA</small><h2>{busca.trim() ? "Resultados da busca" : categoria === "Naturais" ? "Um cuidado para cada rotina" : categoria}</h2><p>{busca.trim() ? "Encontre sua fórmula em todas as categorias da Botica." : "Conheça as apresentações, confira os detalhes e escolha com tranquilidade."}</p><span className="catalog-count" aria-live="polite">{filtrados.length} {filtrados.length === 1 ? "produto encontrado" : "produtos encontrados"}</span></div></div>
        <div className="catalog-tools">
          <label className="catalog-search"><span><Icon name="search" /></span><input value={busca} onChange={(e) => setBusca(e.target.value)} type="search" maxLength={120} placeholder="Busque por produto ou objetivo" aria-label="Buscar produtos" />{busca && <button onClick={() => setBusca("")} aria-label="Limpar busca">×</button>}</label>
          <label className="catalog-sort"><span>Ordenar por</span><select value={ordem} onChange={(e) => setOrdem(e.target.value)}><option value="relevancia">Mais relevantes</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option><option value="nome">Nome A–Z</option></select></label>
        </div>
        <div className="category-tabs" aria-label="Categorias de produtos">
          {categorias.map((item) => <button key={item} className={!busca && categoria === item ? "active" : ""} aria-pressed={!busca && categoria === item} onClick={() => { setBusca(""); setCategoria(item); }}>{item}</button>)}
        </div>
        {(busca || ordem !== "relevancia") && <div className="catalog-active-filters"><span>{busca ? `Busca por “${busca}” no catálogo` : `Ordenação personalizada em ${categoria}`}</span><button type="button" onClick={() => { setBusca(""); setOrdem("relevancia"); }}>Limpar filtros <span aria-hidden="true">×</span></button></div>}
        {erro && <div className="notice error" role="status">Não foi possível carregar os preços e a disponibilidade agora. Você pode consultar os produtos abaixo ou tentar novamente em instantes. <button className="catalog-retry" type="button" onClick={() => window.location.reload()}>Tentar novamente</button></div>}
        {filtrados.length ? <div className="products">{filtrados.map((produto) => <CatalogCard key={isConsultation(produto) ? produto.slug : produto.id} produto={produto} />)}</div> : <div className="catalog-empty"><b>{busca ? "Nenhum produto encontrado" : "Categoria sem produtos"}</b><p>{busca ? "Tente buscar pelo nome da fórmula ou pela concentração." : "Novos produtos serão adicionados em breve."}</p>{busca && <button onClick={() => setBusca("")}>LIMPAR BUSCA</button>}</div>}
      </section>

      <CampaignCarousel />
      <section className="about-botica scroll-reveal" id="sobre">
        <div className="about-botica-copy"><small>CONHEÇA A BOTICA</small><h2>Cuidado próximo, seguro e personalizado.</h2><p>A Botica Bioenergética reúne manipulação, produtos naturais e atendimento farmacêutico para tornar cada etapa mais simples — da escolha do produto ao acompanhamento do pedido.</p><a href="#receita">FALAR SOBRE UMA FÓRMULA</a></div>
        <div className="about-botica-points"><article><b>01</b><div><strong>Orientação responsável</strong><p>Informações claras para você comprar com mais confiança.</p></div></article><article><b>02</b><div><strong>Experiência completa</strong><p>Conta, pagamento, pedidos e suporte em um só lugar.</p></div></article><article><b>03</b><div><strong>Atendimento humano</strong><p>Uma equipe preparada para acompanhar suas necessidades.</p></div></article></div>
      </section>
      <section className="rx scroll-reveal" id="receita"><div><small>MANIPULAÇÃO PERSONALIZADA</small><h2>Tem uma receita?</h2><p>Envie sua prescrição. Nossa equipe analisa e entra em contato com o orçamento.</p><ol><li><b>1</b> Envie a receita</li><li><b>2</b> Receba o orçamento</li><li><b>3</b> Aprove seu pedido</li></ol></div><form className="rx-form" onSubmit={enviarReceita}><span><Icon name="upload" /></span><h3>Envie sua receita</h3><p>PDF, JPG ou PNG • até 10 MB</p><label className={receitaArquivo ? "rx-file selected" : "rx-file"}>{receitaArquivo ? receitaArquivo : "SELECIONAR ARQUIVO"}<input name="arquivo" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => { setReceitaArquivo(e.target.files?.[0]?.name || ""); setReceitaMensagem(""); }} required /></label><textarea aria-label="Observação para o orçamento" name="observacao" maxLength={600} placeholder="Observação ou informação para o orçamento (opcional)" /><button disabled={receitaEnviando}>{receitaEnviando ? "ENVIANDO..." : "SOLICITAR ORÇAMENTO"}</button>{receitaMensagem && <strong className="rx-message" role="status">{receitaMensagem}</strong>}</form></section>
      <section className="shopping-faq" aria-labelledby="faq-title">
        <div><small>PODEMOS AJUDAR?</small><h2 id="faq-title">Comprar com tranquilidade.</h2><p>Informações úteis antes de escolher o seu próximo cuidado.</p><a href="mailto:contato@boticabioenergetica.com.br">Fale com a nossa equipe <Icon name="arrow-up-right" /></a></div>
        <div className="faq-items">
          <details><summary>Como calcular o frete e o prazo?</summary><p>Informe seu CEP no produto ou na finalização da compra. O valor e o prazo aparecem antes do pagamento. Confira as condições de entrega para o seu endereço.</p></details>
          <details><summary>Como enviar uma receita para orçamento?</summary><p>Selecione um PDF, JPG ou PNG de até 10 MB na seção “Envie sua receita” e entre na sua conta para concluir o envio. A equipe analisa a prescrição e retorna com o orçamento.</p><a href="#receita">Enviar minha receita</a></details>
          <details><summary>Onde acompanho meu pedido?</summary><p>Entre na sua conta e acesse “Meus pedidos” para consultar o pagamento, o andamento e as informações de entrega disponíveis.</p><a href="/minha-conta">Acompanhar pedidos</a></details>
          <details><summary>Preciso de ajuda para escolher uma fórmula?</summary><p>Fale com a equipe farmacêutica antes de comprar. As informações dos produtos não substituem a orientação de um profissional de saúde.</p></details>
        </div>
      </section>
      <section className="newsletter scroll-reveal"><div><small>NOVIDADES DA BOTICA</small><h2>Cuide-se com informação.</h2><p>Receba novidades, conteúdos e ofertas da Botica no seu e-mail.</p></div><form onSubmit={cadastrarNewsletter}><input aria-label="E-mail para receber novidades" autoComplete="email" name="email" type="email" placeholder="Seu melhor e-mail" required disabled={newsletterEnviando} /><label className="newsletter-consent"><input name="consentimento" type="checkbox" value="sim" required /> <span>Autorizo o envio de novidades e ofertas por e-mail. Li a <a href="/politica-de-privacidade">Política de Privacidade</a> e posso cancelar quando quiser.</span></label><button disabled={newsletterEnviando}>{newsletterEnviando ? "CADASTRANDO..." : "QUERO RECEBER"}</button>{newsletterMensagem && <p className="newsletter-message" role="status">{newsletterMensagem}</p>}</form></section>
    </>
  );
}
