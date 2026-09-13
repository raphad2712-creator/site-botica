import Image from "next/image";
import Link from "next/link";
import { consultationHref, consultationImage, type ConsultationProduct } from "@/lib/consultation-products";
import { ProductInformation } from "./product-information";

export function ConsultationProductPage({ produto }: { produto: ConsultationProduct }) {
  return <>
    <nav className="product-breadcrumb" aria-label="Navegação estrutural"><Link href="/">Início</Link><span>›</span><Link href="/?categoria=Naturais#produtos">Naturais</Link><span>›</span><b>{produto.nome}</b></nav>
    <section className="product-page consultation-product-page">
      <div className="consultation-product-visual"><Image src={consultationImage(produto)} alt={`${produto.nome} ${produto.dose}, frasco com ${produto.apresentacao} da Botica Bioenergética`} width={800} height={800} sizes="(max-width: 760px) 95vw, 550px" priority /></div>
      <div className="product-info">
        <small>BOTICA BIOENERGÉTICA</small>
        <h1>{produto.nome} <span>{produto.dose}</span></h1>
        <p className="product-presentation">{produto.apresentacao}</p>
        <a className="product-details-anchor" href="#informacoes">Ver informações do produto ↓</a>
        <div className="consultation-box">
          <b>Consulte a Botica</b>
          <p>Fale com nossa equipe para saber o preço e a disponibilidade deste produto.</p>
          <a className="consultation-cta" href={consultationHref(produto)}>CONSULTAR PREÇO <span aria-hidden="true">→</span></a>
          <small>Abre uma mensagem no seu aplicativo de e-mail.</small>
        </div>
      </div>
    </section>
    <ProductInformation produto={produto} />
    <div className="product-return"><Link href="/#produtos">← Continuar vendo produtos</Link></div>
  </>;
}
