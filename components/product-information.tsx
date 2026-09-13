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
          <p className="product-description">{descricao || `${produto.nome} ${produto.dose}, em frasco com ${produto.apresentacao}, da Botica Bioenergética.`}</p>
          <p>Para informações sobre a composição completa e o modo de uso, fale com a equipe da Botica.</p>
          <a className="product-details-anchor" href={consultationHref(produto)}>Tirar dúvidas por e-mail <span aria-hidden="true">↗</span></a>
        </article>
      </div>
    </section>
  );
}
