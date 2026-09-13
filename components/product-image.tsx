import { imagemCatalogo } from "@/lib/product-images";
import { matchConsultationProduct } from "@/lib/consultation-products";
import { NaturalProductImage } from "./natural-product-image";

type ProductImageProps = {
  nome: string;
  imagemAtual?: string | null;
  className?: string;
};

export function ProductImage({ nome, imagemAtual, className = "" }: ProductImageProps) {
  const natural = matchConsultationProduct(nome);
  if (natural) return <NaturalProductImage produto={natural} className={className} sizes="(max-width: 560px) 280px, 300px" />;
  const imagem = imagemCatalogo(nome, imagemAtual);
  if (!imagem) return <span>BOTICA</span>;

  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`catalog-product-image ${className}`.trim()} src={imagem} alt={nome} loading="lazy" decoding="async" />;
}
