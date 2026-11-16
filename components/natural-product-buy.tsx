import { consultationHref, type ConsultationProduct } from "@/lib/consultation-products";

// Esta apresentação ainda não possui cadastro/estoque confirmado pela farmácia.
export function NaturalProductBuy({ produto, compact = false }: { produto: ConsultationProduct; compact?: boolean }) {
  return <div className={compact ? "natural-buy compact" : "natural-buy"}>
    <div className={compact ? "" : "buy-box"}>
      <a className="buy consultation-contact" href={consultationHref(produto)} aria-label={`Consultar disponibilidade de ${produto.nome}`}>Consultar disponibilidade</a>
    </div>
  </div>;
}
