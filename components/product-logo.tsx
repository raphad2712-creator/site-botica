import { PRODUCT_LOGO_DARK, PRODUCT_LOGO_LIGHT } from "@/lib/product-images";

type ProductLogoProps = {
  nome: string;
  className?: string;
};

export function ProductLogo({ nome, className = "" }: ProductLogoProps) {
  const classes = `catalog-product-image ${className}`.trim();

  return (
    <>
      {/* A imagem da marca é intencionalmente a mesma para todos os produtos. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`${classes} product-image-light`} src={PRODUCT_LOGO_LIGHT} alt={`Logo Botica Bioenergética — ${nome}`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`${classes} product-image-dark`} src={PRODUCT_LOGO_DARK} alt="" aria-hidden="true" />
    </>
  );
}
