import Link from "next/link";
import { formatPrice, type ConsultationProduct } from "@/lib/consultation-products";
import { NaturalProductBuy } from "./natural-product-buy";
import { NaturalProductImage } from "./natural-product-image";

export function ConsultationProductCard({ produto }: { produto: ConsultationProduct }) {
  const href = `/produto/${produto.slug}`;
  return (
    <article className="card pharmacy-card consultation-card">
      <Link href={href} className="photo" aria-label={`Ver ${produto.nome} ${produto.dose}`}>
        <NaturalProductImage produto={produto} sizes="(max-width: 560px) 280px, (max-width: 1000px) 40vw, 300px" />
      </Link>
      <p>{produto.categoria}</p>
      <Link href={href}><h3>{produto.nome} {produto.dose}</h3></Link>
      <span className="product-brand-line">{produto.apresentacao} · Botica Bioenergética</span>
      <strong>{formatPrice(produto.precoDemonstrativo)}</strong>
      <small>Preço demonstrativo</small>
      <NaturalProductBuy produto={produto} compact />
    </article>
  );
}
