import { imagemCatalogo } from "@/lib/product-images";

type ProductImageProps = {
  nome: string;
  imagemAtual?: string | null;
  className?: string;
};

export function ProductImage({ nome, imagemAtual, className = "" }: ProductImageProps) {
  const imagem = imagemCatalogo(nome, imagemAtual);
  if (!imagem) return <span>BOTICA</span>;

  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`catalog-product-image ${className}`.trim()} src={imagem} alt={nome} loading="lazy" decoding="async" />;
}
