import Image from "next/image";
import { consultationArtwork, type ConsultationProduct } from "@/lib/consultation-products";
import { Icon } from "./ui-icon";

export function ProductArtwork({ produto }: { produto: ConsultationProduct }) {
  const source = consultationArtwork(produto);
  const sawPalmetto = produto.slug === "saw-palmetto-320mg";
  return <figure className="product-artwork">
    <a href={source} target="_blank" rel="noopener noreferrer" aria-label={`Ampliar a imagem de ${produto.nome}; abre em outra aba`}>
      <Image src={source} alt={`Arte de apresentação de ${produto.nome} ${produto.dose} enviada pela Botica Bioenergética`} width={sawPalmetto ? 626 : 1254} height={sawPalmetto ? 623 : 1254} sizes="(max-width: 760px) 100vw, 650px" priority />
    </a>
    <figcaption><a href={source} target="_blank" rel="noopener noreferrer"><Icon name="expand" /> Ampliar imagem</a></figcaption>
  </figure>;
}
