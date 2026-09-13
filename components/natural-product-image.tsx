import Image from "next/image";
import { consultationDarkImage, consultationImage, type ConsultationProduct } from "@/lib/consultation-products";

export function NaturalProductImage({ produto, className = "", sizes = "(max-width: 560px) 280px, 300px", priority = false }: { produto: ConsultationProduct; className?: string; sizes?: string; priority?: boolean }) {
  const alt = `${produto.nome} ${produto.dose}, ${produto.apresentacao}, Botica Bioenergética`;
  return <>
    <Image className={`catalog-product-image natural-image-light ${className}`.trim()} src={consultationImage(produto)} alt={alt} width={600} height={600} sizes={sizes} priority={priority} />
    <Image className={`catalog-product-image natural-image-dark ${className}`.trim()} src={consultationDarkImage(produto)} alt={alt} width={1254} height={1254} sizes={sizes} priority={priority} />
  </>;
}
