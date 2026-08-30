import Link from "next/link";

export default function PoliticaTrocasPage() {
  return <main className="policy-page">
    <div className="policy-hero"><small>ATENDIMENTO E PÓS-VENDA</small><h1>Trocas, devoluções e reembolsos</h1><p>Queremos que sua experiência seja segura também depois da compra. Veja abaixo como solicitar atendimento.</p></div>
    <div className="policy-layout">
      <aside><b>Nesta página</b><a href="#arrependimento">Direito de arrependimento</a><a href="#defeito">Defeito ou avaria</a><a href="#personalizados">Produtos personalizados</a><a href="#reembolso">Reembolso</a><a href="#como-solicitar">Como solicitar</a></aside>
      <article>
        <section id="arrependimento"><span>01</span><div><h2>Direito de arrependimento</h2><p>Nas compras realizadas pela internet, o consumidor pode comunicar a desistência em até <b>7 dias corridos</b>, contados do recebimento do produto, conforme o Código de Defesa do Consumidor. A solicitação pode ser feita pela área “Minha conta”.</p><p>Após o registro, enviaremos confirmação por e-mail e as orientações para devolução. O produto deve ser preservado e mantido com seus acessórios, brindes e embalagem quando possível, sem que isso limite direitos garantidos por lei.</p></div></section>
        <section id="defeito"><span>02</span><div><h2>Produto com defeito, avaria ou divergência</h2><p>Informe o problema assim que identificá-lo e envie detalhes que ajudem na análise. Os prazos legais para reclamar de vícios aparentes são de <b>30 dias para produtos não duráveis</b> e <b>90 dias para produtos duráveis</b>, contados da entrega. Em vício oculto, a contagem começa quando o problema se torna evidente.</p></div></section>
        <section id="personalizados"><span>03</span><div><h2>Produtos manipulados ou personalizados</h2><p>Fórmulas preparadas especificamente para o consumidor exigem análise individual por razões sanitárias e de personalização. A Botica avaliará integridade, conservação, divergência da fórmula, avaria e demais circunstâncias. Esta avaliação não exclui o direito de arrependimento nem outros direitos previstos na legislação aplicável.</p></div></section>
        <section id="reembolso"><span>04</span><div><h2>Análise e reembolso</h2><p>Toda solicitação recebe um protocolo e começa com o status <b>“Em análise”</b>. A aprovação não é automática. Quando aprovada, a restituição será solicitada no mesmo meio de pagamento sempre que tecnicamente possível. O prazo para o valor aparecer pode variar conforme banco, cartão ou provedor de pagamento.</p><p>Não envie produtos antes de receber as instruções da equipe. Quando houver devolução física, a Botica informará o procedimento e acompanhará o recebimento.</p></div></section>
        <section id="como-solicitar"><span>05</span><div><h2>Como solicitar</h2><ol><li>Entre em <b>Minha conta</b> e localize o pedido.</li><li>Clique em “Solicitar troca, devolução ou reembolso”.</li><li>Selecione o tipo, descreva o motivo e envie.</li><li>Acompanhe o protocolo no site e pelo seu e-mail cadastrado.</li></ol><Link href="/minha-conta">IR PARA MINHA CONTA</Link></div></section>
        <p className="policy-note">Esta política deve ser revisada pela empresa responsável antes da publicação definitiva e pode ser atualizada para refletir o processo logístico e o provedor de pagamentos adotados.</p>
      </article>
    </div>
  </main>;
}
