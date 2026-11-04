import Image from "next/image";
import { consultationImage, type ConsultationProduct } from "@/lib/consultation-products";
import { Icon } from "./ui-icon";

export function ProductArtwork({ produto }: { produto: ConsultationProduct }) {
  const src = consultationImage(produto);
  return (
    <figure className="product-artwork botica-product-artwork" aria-label={`Imagem de ${produto.nome}`}>
      <div className="botica-product-artwork-image">
        <Image
          className="botica-single-product-image"
          src={src}
          alt={`${produto.nome} ${produto.dose}, ${produto.apresentacao}, Botica Bioenergética`}
          width={800}
          height={800}
          sizes="(max-width: 760px) 100vw, 620px"
          priority
        />
      </div>
      <figcaption>
        <a href={src} target="_blank" rel="noopener noreferrer">
          <Icon name="expand" /> Ampliar imagem
        </a>
      </figcaption>
    </figure>
  );
}
