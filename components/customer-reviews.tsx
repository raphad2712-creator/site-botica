import { Icon } from "@/components/ui-icon";

const placeId = "ChIJSwdvoLtjzpQR9ppLJr82N7k";
// Destino de avaliações enviado pelo responsável pela loja, sem parâmetros de rastreamento.
const perfilGoogle = "https://www.google.com/search?hl=pt_BR&q=avalia%C3%A7%C3%B5es+sobre+botica+bioenerg%C3%A9tica+farm%C3%A1cia+de+manipula%C3%A7%C3%A3o+s%C3%A3o+paulo&si=AE1YtOqiKPb2pdLXAi8quZ9vbH4aVq_aX8-3H9iFBLpRNK95czfQ8hxLfhIuik_ESwa-6FCyFn3KcbsA7qqvyoDjlZtSFxdSIcMKCvmwN8hhaknVrUd61UFAUjtkqI0vB0-LhF3kC1qVuFK0XgPnW-ENuJzD0Tc5a0FekOvwn9FplP64ZO39D0MEd6uKzyOFXN_Tu7mqqlKFKTEHTr41VhCxns1JjL_e0Q%3D%3D";

// Transcrição dos prints do Google enviados pela loja. Sem atualização automática.
const avaliacoes = [
  { nome: "Heloisa Barbosa", texto: "Atendimento muito bom, tanto presencial como online. São bem prestativos e educados. Comprarei sempre que precisar" },
  { nome: "Wellington Oliveira", texto: "foi ótima, atendimento incrível e a entrega super rápida 🫶🏻" },
  { nome: "Maria Neves Neri", texto: "Um excelente atendimento comprei medicamentos várias vezes, tudo certinho, bem embalado. Vou continuar comprando. Super indico." },
  { nome: "Capoeira Andrade", texto: "Farmácia de manipulação incrível, profissionais super respeitosos e atenciosos!" },
  { nome: "Chuck Gomes", texto: "Excelente atendimento." },
  { nome: "Sueli Canteiro", texto: "Excelente atendimento." },
  { nome: "leonardo gomes", texto: "Muito educado. Melhores manipulados!" },
  { nome: "Hora", texto: "Atendimento excelente super recomendo." },
  { nome: "Maciel Ferreira da Silva", texto: "Obrigado pelos medicamentos são muito bons estou me sentindo bem melhor valeu Deus abençoe tmj" },
  { nome: "COLÉGIO VITORIA", texto: "Atendimento nota 10 super indico" },
  { nome: "Rosana Amorim", texto: "Sempre satisfatória!", trecho: true },
];

function ReviewCard({ avaliacao }: { avaliacao: (typeof avaliacoes)[number] }) {
  const iniciais = avaliacao.nome.split(" ").slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
  return <figure className="customer-review-card">
    <figcaption><span className="review-avatar" aria-hidden="true">{iniciais}</span><div><strong>{avaliacao.nome}</strong><small>Avaliação no Google</small></div><span className="review-google-mark" aria-hidden="true">G</span></figcaption>
    <div className="review-stars" role="img" aria-label="5 de 5 estrelas">{Array.from({ length: 5 }, (_, index) => <svg key={index} viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3.1 6.3 7 .9-5.1 4.9 1.2 6.9-6.2-3.3-6.2 3.3 1.2-6.9L2 9.2l6.9-.9Z" /></svg>)}</div>
    <blockquote>{avaliacao.texto}</blockquote>
    {avaliacao.trecho && <small className="review-excerpt">Trecho da avaliação</small>}
  </figure>;
}

export function CustomerReviews() {
  return (
    <section className="customer-reviews" id="avaliacoes" aria-labelledby="reviews-title">
      <div className="customer-reviews-copy">
        <small>AVALIAÇÕES DE CLIENTES</small>
        <h2 id="reviews-title">Cuidado que faz a diferença.<br /><em>Quem conhece, recomenda.</em></h2>
        <p>Conheça uma seleção de avaliações publicadas no Google por clientes da Botica.</p>
        <a className="reviews-primary-link" href={perfilGoogle} target="_blank" rel="noopener noreferrer">VER AVALIAÇÕES NO GOOGLE <Icon name="arrow-up-right" /><span className="reviews-sr-only"> (abre em uma nova aba)</span></a>
      </div>
      <div className="customer-reviews-profile">
        <span className="reviews-platform"><span className="review-google-mark" aria-hidden="true">G</span> AVALIAÇÕES NO GOOGLE</span><div className="reviews-selection"><strong>{avaliacoes.length}</strong><span>depoimentos de clientes<br />selecionados para você</span></div>
        <h3>Botica Bioenergética</h3>
        <p>Farmácia de manipulação</p>
        <address>Rua Sol da Meia-Noite, 990<br />São Miguel Paulista — São Paulo/SP</address>
        <a href={`https://search.google.com/local/writereview?placeid=${placeId}`} target="_blank" rel="noopener noreferrer">Avaliar a Botica <Icon name="arrow-up-right" /><span className="reviews-sr-only"> (abre em uma nova aba)</span></a>
      </div>
      <div className="customer-review-list">{avaliacoes.slice(0, 6).map((avaliacao) => <ReviewCard key={avaliacao.nome} avaliacao={avaliacao} />)}</div>
      <details className="customer-reviews-more"><summary><span className="reviews-more-closed">Ver mais {avaliacoes.length - 6} avaliações</span><span className="reviews-more-open">Mostrar menos avaliações</span><Icon name="arrow-right" /></summary><div className="customer-review-list">{avaliacoes.slice(6).map((avaliacao) => <ReviewCard key={avaliacao.nome} avaliacao={avaliacao} />)}</div></details>
    </section>
  );
}
