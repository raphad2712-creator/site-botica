"use client";

import { Icon } from "@/components/ui-icon";


import { useEffect, useMemo, useState } from "react";
import type { Produto } from "@/lib/types";
import { ProductCard } from "./product-card";
import { CampaignCarousel } from "./campaign-carousel";
import { ConsultationProductCard } from "./consultation-product-card";
import { buildCatalog, filterCatalog, isConsultation, type CatalogProduct } from "@/lib/catalog";

function CatalogCard({ produto }: { produto: CatalogProduct }) {
  return isConsultation(produto)
    ? <ConsultationProductCard produto={produto} />
    : <ProductCard produto={produto} />;
}

export function Storefront({ produtos, erro }: { produtos: Produto[]; erro?: string }) {
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("relevancia");
  const [newsletterMensagem, setNewsletterMensagem] = useState("");
  const [newsletterEnviando, setNewsletterEnviando] = useState(false);
  const [receitaArquivo, setReceitaArquivo] = useState("");
  const [receitaMensagem, setReceitaMensagem] = useState("");
  const [receitaEnviando, setReceitaEnviando] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const termo = params.get("busca");
    if (termo) setBusca(termo);
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible")),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".scroll-reveal").forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const catalogo = useMemo(() => buildCatalog(produtos), [produtos]);
  const filtrados = useMemo(() => filterCatalog(catalogo, "Todos", busca, ordem), [catalogo, busca, ordem]);

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
          <h1>Seu cuidado, do seu jeito.</h1>
          <p>
            Fórmulas personalizadas, suplementos e dermocosméticos com qualidade
            e acompanhamento farmacêutico.
          </p>
          <div className="hero-actions"><a href="#produtos">COMPRAR AGORA</a><a className="hero-secondary" href="#receita">ENVIAR RECEITA</a></div>
          <div className="hero-assurances"><span><Icon name="shield" /> Compra protegida</span><span><Icon name="check" /> Atendimento farmacêutico</span><span><Icon name="check" /> Entrega para todo o Brasil</span></div>
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

      <CampaignCarousel />
      <section className="natural-line-intro scroll-reveal" aria-label="Diferenciais da linha natural">
        <article><Icon name="leaf" /><div><strong>Seleção Botica</strong><span>Oito fórmulas em uma linha clara e fácil de escolher.</span></div></article>
        <article><Icon name="document" /><div><strong>Informação completa</strong><span>Apresentação, concentração e detalhes de cada produto.</span></div></article>
        <article><Icon name="shield" /><div><strong>Compra segura</strong><span>Pagamento protegido e suporte durante todo o pedido.</span></div></article>
      </section>

      <section className="catalog scroll-reveal" id="produtos">
        <div className="catalog-head"><div><small>BOTICA BIOENERGÉTICA</small><h2>Nossa linha natural</h2><p>Fórmulas selecionadas em cápsulas para complementar a sua rotina de cuidado.</p><span className="catalog-count" aria-live="polite">{filtrados.length} {filtrados.length === 1 ? "produto encontrado" : "produtos encontrados"}</span></div></div>
        <div className="catalog-tools">
          <label className="catalog-search"><span><Icon name="search" /></span><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Busque por produto ou objetivo" aria-label="Buscar produtos" />{busca && <button onClick={() => setBusca("")} aria-label="Limpar busca">×</button>}</label>
          <label className="catalog-sort"><span>Ordenar por</span><select value={ordem} onChange={(e) => setOrdem(e.target.value)}><option value="relevancia">Mais relevantes</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option><option value="nome">Nome A–Z</option></select></label>
        </div>
        {erro && <div className="notice error" role="status">Não foi possível carregar os preços e a disponibilidade agora. Você pode consultar os produtos abaixo ou tentar novamente em instantes.</div>}
        {filtrados.length ? <div className="products">{filtrados.map((produto) => <CatalogCard key={isConsultation(produto) ? produto.slug : produto.id} produto={produto} />)}</div> : <div className="catalog-empty"><b>Nenhum produto encontrado</b><p>Tente buscar pelo nome da fórmula ou pela concentração.</p><button onClick={() => setBusca("")}>LIMPAR BUSCA</button></div>}
      </section>

      <section className="campaign scroll-reveal"><div><small>CUIDADO COMPLETO</small><h2>Seu bem-estar começa com escolhas melhores.</h2><p>Encontre suplementos, vitaminas e dermocosméticos selecionados para a sua rotina.</p><a href="#produtos">CONHECER PRODUTOS</a></div></section>
      <section className="about-botica scroll-reveal" id="sobre">
        <div className="about-botica-copy"><small>CONHEÇA A BOTICA</small><h2>Cuidado próximo, seguro e personalizado.</h2><p>A Botica Bioenergética reúne manipulação, produtos naturais e atendimento farmacêutico para tornar cada etapa mais simples — da escolha do produto ao acompanhamento do pedido.</p><a href="#receita">FALAR SOBRE UMA FÓRMULA</a></div>
        <div className="about-botica-points"><article><b>01</b><div><strong>Orientação responsável</strong><p>Informações claras para você comprar com mais confiança.</p></div></article><article><b>02</b><div><strong>Experiência completa</strong><p>Conta, pagamento, pedidos e suporte em um só lugar.</p></div></article><article><b>03</b><div><strong>Atendimento humano</strong><p>Uma equipe preparada para acompanhar suas necessidades.</p></div></article></div>
      </section>
      <section className="rx scroll-reveal" id="receita"><div><small>MANIPULAÇÃO PERSONALIZADA</small><h2>Tem uma receita?</h2><p>Envie sua prescrição. Nossa equipe analisa e entra em contato com o orçamento.</p><ol><li><b>1</b> Envie a receita</li><li><b>2</b> Receba o orçamento</li><li><b>3</b> Aprove seu pedido</li></ol></div><form className="rx-form" onSubmit={enviarReceita}><span><Icon name="upload" /></span><h3>Envie sua receita</h3><p>PDF, JPG ou PNG • até 10 MB</p><label className={receitaArquivo ? "rx-file selected" : "rx-file"}>{receitaArquivo ? receitaArquivo : "SELECIONAR ARQUIVO"}<input name="arquivo" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => { setReceitaArquivo(e.target.files?.[0]?.name || ""); setReceitaMensagem(""); }} required /></label><textarea name="observacao" maxLength={600} placeholder="Observação ou informação para o orçamento (opcional)" /><button disabled={receitaEnviando}>{receitaEnviando ? "ENVIANDO..." : "SOLICITAR ORÇAMENTO"}</button>{receitaMensagem && <strong className="rx-message" role="status">{receitaMensagem}</strong>}</form></section>
      <section className="newsletter scroll-reveal"><div><small>NOVIDADES DA BOTICA</small><h2>Cuide-se com informação.</h2><p>Receba novidades, conteúdos e ofertas da Botica no seu e-mail.</p></div><form onSubmit={cadastrarNewsletter}><input name="email" type="email" placeholder="Seu melhor e-mail" required disabled={newsletterEnviando} /><label className="newsletter-consent"><input name="consentimento" type="checkbox" value="sim" required /> <span>Autorizo o envio de novidades e ofertas por e-mail. Li a <a href="/politica-de-privacidade">Política de Privacidade</a> e posso cancelar quando quiser.</span></label><button disabled={newsletterEnviando}>{newsletterEnviando ? "CADASTRANDO..." : "QUERO RECEBER"}</button>{newsletterMensagem && <p className="newsletter-message" role="status">{newsletterMensagem}</p>}</form></section>
    </>
  );
}
