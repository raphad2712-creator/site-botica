"use client";

import { Icon } from "@/components/ui-icon";


import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { consultationProducts, consultationImage } from "@/lib/consultation-products";

const banners = ["passiflora-300mg", "isoflavona-100mg", "berberina-500mg", "maca-peruana-500mg"].map(
  (slug) => consultationProducts.find((product) => product.slug === slug)!,
);
const INTERVAL = 7000;

export function CampaignCarousel() {
  const carousel = useRef<HTMLElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const playing = !paused && !hovered && visible && pageVisible && !reducedMotion;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.25 });
    if (carousel.current) observer.observe(carousel.current);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setActive((current) => (current + 1) % banners.length), INTERVAL);
    return () => window.clearTimeout(timer);
  }, [active, playing]);

  function move(direction: number) {
    setPaused(true);
    setActive((current) => (current + direction + banners.length) % banners.length);
  }

  return (
    <section ref={carousel} className={`botica-campaign-carousel animated-carousel${playing ? " is-playing" : ""}`} aria-label="Destaques da Botica" aria-roledescription="carrossel"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={(event) => { if (event.pointerType === "mouse") setHovered(false); }}
      onFocusCapture={(event) => { if (!(event.target as HTMLElement).closest("[data-autoplay-control]")) setPaused(true); }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}>
      <div className="carousel-heading"><span>CONHEÇA A LINHA BOTICA</span><Link href="/?categoria=Naturais#produtos">Ver todos os produtos <span aria-hidden="true"><Icon name="arrow-up-right" /></span></Link></div>
      <div className="campaign-track" id="campaign-slides" tabIndex={0} aria-label="Destaques; use as setas para navegar"
        onTouchStart={(event) => {
          const point = event.touches[0];
          touch.current = event.touches.length === 1 ? { x: point.clientX, y: point.clientY } : null;
          setPaused(true);
        }}
        onTouchCancel={() => { touch.current = null; }}
        onTouchEnd={(event) => {
          const start = touch.current;
          touch.current = null;
          if (!start || !event.changedTouches.length) return;
          const point = event.changedTouches[0];
          const dx = point.clientX - start.x;
          const dy = point.clientY - start.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
        }}>
        {banners.map((banner, index) => (
          <article className={`campaign-slide campaign-slide-${index}${index === active ? " is-active" : ""}`} key={banner.slug} aria-label={`${index + 1} de ${banners.length}: ${banner.nome}`} aria-roledescription="slide" aria-hidden={index !== active} inert={index !== active}>
            <div className="campaign-slide-copy">
              <small>BOTICA BIOENERGÉTICA</small>
              <h2>{banner.nome}<span className="campaign-dose">{banner.dose}</span></h2>
              <p>{banner.apresentacao}. Conheça a apresentação e consulte nossa equipe para saber mais.</p>
              <Link href={`/produto/${banner.slug}`}>Conhecer o produto <span aria-hidden="true"><Icon name="arrow-right" /></span></Link>
            </div>
            <div className="campaign-slide-image"><Image src={consultationImage(banner)} alt={`${banner.nome} ${banner.dose}, ${banner.apresentacao}, Botica Bioenergética`} width={400} height={400} sizes="(max-width: 560px) 200px, 340px" /></div>
          </article>
        ))}
      </div>
      <div className="campaign-controls">
        <button type="button" onClick={() => move(-1)} aria-label="Banner anterior" aria-controls="campaign-slides"><Icon name="arrow-left" /></button>
        <div className="campaign-dots">{banners.map((banner, index) => <button type="button" key={banner.slug} onClick={() => { setPaused(true); setActive(index); }} aria-label={`Ver banner ${banner.nome}`} aria-controls="campaign-slides" aria-current={index === active ? "true" : undefined} />)}</div>
        <button type="button" onClick={() => move(1)} aria-label="Próximo banner" aria-controls="campaign-slides"><Icon name="arrow-right" /></button>
        {!reducedMotion && <button className="carousel-play" type="button" data-autoplay-control onClick={() => setPaused((current) => !current)} aria-label={paused ? "Retomar avanço automático" : "Pausar avanço automático"} aria-pressed={!paused}><span aria-hidden="true"><Icon name={paused ? "play" : "pause"} /></span><span>{paused ? "Reproduzir" : "Pausar"}</span></button>}
      </div>
      <p className="carousel-status" aria-live={playing ? "off" : "polite"} aria-atomic="true">{active + 1} / {banners.length} · {banners[active].nome}</p>
      <div className="carousel-progress" aria-hidden="true"><span key={`${active}-${playing}`} /></div>
    </section>
  );
}
