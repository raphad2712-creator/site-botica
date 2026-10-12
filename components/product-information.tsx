import { Icon } from "@/components/ui-icon";
import { consultationHref, type ConsultationProduct } from "@/lib/consultation-products";

export function ProductInformation({ produto, descricao }: { produto: ConsultationProduct; descricao?: string }) {
  return (
    <section className="product-information" id="informacoes" aria-labelledby="product-information-title">
      <div className="product-information-heading"><small>CONHEÇA O PRODUTO</small><h2 id="product-information-title">Informações sobre {produto.nome}</h2></div>
      <div className="product-information-grid">
        <article>
          <h3>Apresentação</h3>
          <dl>
            <div><dt>Produto</dt><dd>{produto.nome}</dd></div>
            <div><dt>Concentração no rótulo</dt><dd>{produto.dose}</dd></div>
            <div><dt>Conteúdo</dt><dd>{produto.apresentacao}</dd></div>
            <div><dt>Marca</dt><dd>Botica Bioenergética</dd></div>
          </dl>
        </article>
        <article>
          <h3>Sobre o produto</h3>
          <p className="product-description">{produto.descricao}</p>
          {descricao && descricao !== produto.descricao && <p className="product-description-complement">{descricao}</p>}
          <p>A composição completa, os ingredientes e as orientações de uso devem ser conferidos no rótulo recebido ou com a equipe farmacêutica.</p>
          <a className="product-details-anchor" href={consultationHref(produto)}>Tirar dúvidas por e-mail <span aria-hidden="true"><Icon name="arrow-up-right" /></span></a>
        </article>
        <article>
          <h3>Orientações importantes</h3>
          <ul className="product-guidance-list">
            <li>Confira o lacre e o rótulo antes do uso.</li>
            <li>Conserve em local seco, fresco e protegido da luz.</li>
            <li>Mantenha fora do alcance de crianças.</li>
            <li>Em caso de dúvida, procure orientação de um profissional de saúde.</li>
          </ul>
          <p className="product-info-disclaimer">As informações desta página não substituem avaliação ou orientação profissional.</p>
        </article>
      </div>
    </section>
  );
}
