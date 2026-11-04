import Image from "next/image";
import { consultationImage, type ConsultationProduct } from "@/lib/consultation-products";

export function NaturalProductImage({
  produto,
  className = "",
  sizes = "(max-width: 560px) 280px, 300px",
  priority = false,
}: {
  produto: ConsultationProduct;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const alt = `${produto.nome} ${produto.dose}, ${produto.apresentacao}, Botica Bioenergética`;
  return (
    <Image
      className={`catalog-product-image botica-single-product-image ${className}`.trim()}
      src={consultationImage(produto)}
      alt={alt}
      width={800}
      height={800}
      sizes={sizes}
      priority={priority}
    />
  );
}
