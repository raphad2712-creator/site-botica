import Link from "next/link";
import { formatPrice, type ConsultationProduct } from "@/lib/consultation-products";
import { ProductInformation } from "./product-information";
import { ProductArtwork } from "./product-artwork";
import { NaturalProductBuy } from "./natural-product-buy";
import { Icon } from "./ui-icon";
import { ShippingCalculator } from "./shipping-calculator";

export function ConsultationProductPage({ produto }: { produto: ConsultationProduct }) {
  return <>
    <nav className="product-breadcrumb" aria-label="Navegação estrutural"><Link href="/">Início</Link><span>›</span><Link href="/?categoria=Naturais#produtos">Naturais</Link><span>›</span><b>{produto.nome}</b></nav>
    <section className="product-page consultation-product-page">
      <ProductArtwork produto={produto} />
      <div className="product-info">
        <small>BOTICA BIOENERGÉTICA</small>
        <h1>{produto.nome} <span>{produto.dose}</span></h1>
        <p className="product-presentation">{produto.apresentacao}</p>
        <strong className="demo-product-price">{formatPrice(produto.precoDemonstrativo)}</strong>
        <span className="demo-price-note">Preço demonstrativo</span>
        <a className="product-details-anchor" href="#informacoes">Ver informações do produto <Icon name="arrow-down" /></a>
        <NaturalProductBuy produto={produto} />
        <ShippingCalculator subtotal={produto.precoDemonstrativo} />
      </div>
    </section>
    <ProductInformation produto={produto} />
    <div className="product-return"><Link href="/#produtos"><Icon name="arrow-left" /> Continuar vendo produtos</Link></div>
  </>;
}
