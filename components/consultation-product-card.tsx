import Link from "next/link";
import { formatPrice, type ConsultationProduct } from "@/lib/consultation-products";
import { NaturalProductBuy } from "./natural-product-buy";
import { NaturalProductImage } from "./natural-product-image";

export function ConsultationProductCard({ produto }: { produto: ConsultationProduct }) {
  const href = `/produto/${produto.slug}`;
  const destaque = produto.slug === "testo-plus-30caps";
  return (
    <article className={`card pharmacy-card consultation-card mockup-product-card${destaque ? " mockup-testo-card" : ""}`}>
      <div className="mockup-product-visual">
        <Link href={href} className="photo mockup-photo" aria-label={`Ver ${produto.nome} ${produto.dose}`}>
          <NaturalProductImage produto={produto} sizes="(max-width: 600px) 45vw, (max-width: 1100px) 35vw, 330px" />
        </Link>
      </div>
      <div className="mockup-product-copy">
        <span className="mockup-category">{produto.categoria}</span>
        <Link href={href} className="mockup-product-title"><h3>{produto.nome}{produto.dose ? ` ${produto.dose}` : ""}</h3></Link>
        <span className="mockup-presentation">{produto.apresentacao}</span>
        <div className="mockup-product-footer">
          <div className="mockup-price-group">
            <strong>{formatPrice(produto.precoDemonstrativo)}</strong>
            <small>Disponibilidade a confirmar</small>
          </div>
          <NaturalProductBuy produto={produto} compact />
        </div>
      </div>
    </article>
  );
}
