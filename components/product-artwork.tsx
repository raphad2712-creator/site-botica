"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { consultationArtwork, consultationImage, type ConsultationProduct } from "@/lib/consultation-products";
import { Icon } from "./ui-icon";

export function ProductArtwork({ produto }: { produto: ConsultationProduct }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const sources = [consultationImage(produto), consultationArtwork(produto)];
  function show(index: number) {
    const element = track.current;
    if (!element) return;
    element.scrollTo({ left: index * element.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  return <figure className="product-artwork" aria-label={`Fotos de ${produto.nome}`}>
    <div className="product-gallery-track" ref={track} tabIndex={0} aria-label="Galeria do produto; deslize para ver as informações"
      onScroll={() => { if (track.current) setActive(Math.round(track.current.scrollLeft / track.current.clientWidth)); }}
      onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); show(active === 0 ? 1 : 0); } }}>
      {sources.map((source, index) => <div className="product-gallery-slide" key={source}>
        <Image src={source} alt={index === 0 ? `${produto.nome} ${produto.dose}, ${produto.apresentacao}, foto do produto` : `Informações de ${produto.nome} ${produto.dose}`} width={1254} height={1254} sizes="(max-width: 760px) 100vw, 650px" priority={index === 0} />
      </div>)}
    </div>
    <div className="product-gallery-controls">
      <button type="button" aria-label="Foto anterior" onClick={() => show(active === 0 ? 1 : 0)}><Icon name="arrow-left" /></button>
      <div>{sources.map((source, index) => <button type="button" key={source} aria-label={index === 0 ? "Ver foto do produto" : "Ver imagem das informações"} aria-current={active === index ? "true" : undefined} onClick={() => show(index)}><Image src={source} alt="" width={48} height={48} /></button>)}</div>
      <button type="button" aria-label="Próxima foto" onClick={() => show(active === 0 ? 1 : 0)}><Icon name="arrow-right" /></button>
    </div>
    <figcaption><span aria-live="polite">{active + 1} / 2 · {active === 0 ? "Produto" : "Informações"}</span><a href={sources[active]} target="_blank" rel="noopener noreferrer"><Icon name="expand" /> Ampliar imagem</a></figcaption>
  </figure>;
}
