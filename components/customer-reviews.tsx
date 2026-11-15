import { Icon } from "@/components/ui-icon";

const placeId = "ChIJSwdvoLtjzpQR9ppLJr82N7k";
// Destino de avaliações enviado pelo responsável pela loja, sem parâmetros de rastreamento.
const perfilGoogle = "https://www.google.com/search?hl=pt_BR&q=avalia%C3%A7%C3%B5es+sobre+botica+bioenerg%C3%A9tica+farm%C3%A1cia+de+manipula%C3%A7%C3%A3o+s%C3%A3o+paulo&si=AE1YtOqiKPb2pdLXAi8quZ9vbH4aVq_aX8-3H9iFBLpRNK95czfQ8hxLfhIuik_ESwa-6FCyFn3KcbsA7qqvyoDjlZtSFxdSIcMKCvmwN8hhaknVrUd61UFAUjtkqI0vB0-LhF3kC1qVuFK0XgPnW-ENuJzD0Tc5a0FekOvwn9FplP64ZO39D0MEd6uKzyOFXN_Tu7mqqlKFKTEHTr41VhCxns1JjL_e0Q%3D%3D";

export function CustomerReviews() {
  return (
    <section className="customer-reviews" id="avaliacoes" aria-labelledby="reviews-title">
      <div className="customer-reviews-copy">
        <small>AVALIAÇÕES DE CLIENTES</small>
        <h2 id="reviews-title">A experiência de quem escolhe a Botica.</h2>
        <p>Consulte as avaliações no Google e conheça as experiências compartilhadas pelos nossos clientes.</p>
        <a className="reviews-primary-link" href={perfilGoogle} target="_blank" rel="noopener noreferrer">VER AVALIAÇÕES NO GOOGLE <Icon name="arrow-up-right" /><span className="reviews-sr-only"> (abre em uma nova aba)</span></a>
      </div>
      <div className="customer-reviews-profile">
        <span className="reviews-platform">Google Maps</span>
        <h3>Botica Bioenergética</h3>
        <p>Farmácia de manipulação</p>
        <address>Rua Sol da Meia-Noite, 990<br />São Miguel Paulista — São Paulo/SP</address>
        <a href={`https://search.google.com/local/writereview?placeid=${placeId}`} target="_blank" rel="noopener noreferrer">Já conhece a Botica? Conte sua experiência <Icon name="arrow-up-right" /><span className="reviews-sr-only"> (abre em uma nova aba)</span></a>
      </div>
    </section>
  );
}
