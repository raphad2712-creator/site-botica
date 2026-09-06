import { imagemCatalogo } from "@/lib/product-images";

type ProductImageProps = {
  nome: string;
  className?: string;
};

export function ProductImage({ nome, className = "" }: ProductImageProps) {
  const imagem = imagemCatalogo(nome);
  if (!imagem) return <span>BOTICA</span>;

  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`catalog-product-image ${className}`.trim()} src={imagem} alt={nome} />;
}
