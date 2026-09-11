"use client";

import { useRef, useState } from "react";

const banners = [
  { tag: "ROTINA & MOVIMENTO", title: "Seu próximo cuidado começa aqui.", text: "Conheça a linha de suplementos da Botica e encontre os produtos para sua rotina.", image: "/produtos/creatina-monohidratada-300g.jpg", alt: "Creatina Monohidratada Botica", category: "Academia", cta: "Explorar suplementos" },
  { tag: "VITAMINAS & MINERAIS", title: "Pequenos hábitos. Cuidado diário.", text: "Explore nossa seleção de vitaminas e consulte os detalhes de cada fórmula.", image: "/produtos/vitamina-b12-1000mcg.jpg", alt: "Vitamina B12 Botica", category: "Vitaminas", cta: "Conhecer vitaminas" },
  { tag: "BELEZA & AUTOCUIDADO", title: "Um momento só seu.", text: "Descubra os produtos da linha de beleza e complete sua rotina de autocuidado.", image: "/produtos/serum-vitamina-c-30ml.jpg", alt: "Sérum de Vitamina C Botica", category: "Beleza", cta: "Ver linha de beleza" },
];

export function CampaignCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  function go(index: number) {
    const element = track.current;
    if (!element) return;
    const next = (index + banners.length) % banners.length;
    element.scrollTo({ left: next * element.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  return <section className="botica-campaign-carousel" aria-label="Conheça as linhas da Botica" aria-roledescription="carrossel">
    <div className="campaign-track" ref={track} onScroll={() => { const element = track.current; if (element) setActive(Math.round(element.scrollLeft / element.clientWidth)); }}>
      {banners.map((banner, index) => <article className={`campaign-slide campaign-slide-${index}`} key={banner.category} aria-label={`${index + 1} de ${banners.length}`} aria-roledescription="slide" inert={index !== active}>
        <div className="campaign-slide-copy"><small>{banner.tag}</small><h2>{banner.title}</h2><p>{banner.text}</p><a href={`/?categoria=${encodeURIComponent(banner.category)}#produtos`}>{banner.cta} <span aria-hidden="true">→</span></a></div>
        <div className="campaign-slide-image"><img src={banner.image} alt={banner.alt} loading="lazy" width="400" height="400" /></div>
      </article>)}
    </div>
    <div className="campaign-controls"><button type="button" onClick={() => go(active - 1)} aria-label="Banner anterior">←</button><div>{banners.map((banner, index) => <button type="button" key={banner.category} onClick={() => go(index)} aria-label={`Ver banner ${banner.category}`} aria-current={index === active ? "true" : undefined} />)}</div><button type="button" onClick={() => go(active + 1)} aria-label="Próximo banner">→</button></div>
  </section>;
}
