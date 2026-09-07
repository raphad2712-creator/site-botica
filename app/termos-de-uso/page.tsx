import Link from "next/link";

export default function TermosDeUsoPage() {
  return <main className="policy-page"><div className="policy-hero"><small>TRANSPARÊNCIA E SEGURANÇA</small><h1>Termos de uso</h1><p>Condições gerais para navegar, criar uma conta e comprar no site da Botica Bioenergética.</p></div><div className="policy-layout"><aside><b>Nesta página</b><a href="#uso">Uso do site</a><a href="#conta">Conta do cliente</a><a href="#produtos">Produtos e informações</a><a href="#pedidos">Pedidos e pagamento</a><a href="#atendimento">Atendimento</a></aside><article>
    <section id="uso"><span>01</span><div><h2>Uso do site</h2><p>Ao utilizar este site, você se compromete a fornecer informações verdadeiras e a usar os recursos disponíveis de maneira lícita e responsável.</p></div></section>
    <section id="conta"><span>02</span><div><h2>Conta do cliente</h2><p>Você é responsável por manter seus dados de acesso protegidos. Caso identifique qualquer uso não autorizado, entre em contato com a Botica.</p></div></section>
    <section id="produtos"><span>03</span><div><h2>Produtos e informações</h2><p>As informações do catálogo têm caráter informativo. Fórmulas manipuladas dependem da análise da receita e da orientação de profissional habilitado.</p></div></section>
    <section id="pedidos"><span>04</span><div><h2>Pedidos e pagamento</h2><p>Preços, disponibilidade, frete e condições de pagamento são confirmados durante a finalização. O pedido é considerado concluído após a confirmação do pagamento.</p></div></section>
    <section id="atendimento"><span>05</span><div><h2>Atendimento e pós-venda</h2><p>Solicitações relacionadas a pedidos podem ser acompanhadas pela área do cliente. Trocas e devoluções seguem a política específica e a legislação aplicável.</p><Link href="/politica-de-trocas-e-devolucoes">CONSULTAR POLÍTICA DE TROCAS</Link></div></section>
  </article></div></main>;
}
