export function PaymentMethods() {
  return <div className="footer-payment-methods">
    <ul className="footer-payment-list" aria-label="Formas de pagamento aceitas">
      <li><div className="footer-payment-logo footer-payment-pix" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="m20 3 8 8h-3a5 5 0 0 0-3.5 1.5L20 14l-1.5-1.5A5 5 0 0 0 15 11h-3Zm17 17-7 7h-5a2 2 0 0 1-1.4-.6L20 22.8l-3.6 3.6a2 2 0 0 1-1.4.6h-5l-7-7 7-7h5a2 2 0 0 1 1.4.6l3.6 3.6 3.6-3.6A2 2 0 0 1 25 13h5ZM20 37l-8-8h3a5 5 0 0 0 3.5-1.5L20 26l1.5 1.5A5 5 0 0 0 25 29h3Z" /></svg><span>pix</span></div><span className="footer-payment-name">Pix</span></li>
      <li><div className="footer-payment-logo footer-payment-visa" aria-hidden="true">VISA</div><span className="footer-payment-name">Visa</span></li>
      <li><div className="footer-payment-logo" aria-hidden="true"><svg className="footer-mastercard-symbol" viewBox="0 0 80 48"><circle cx="29" cy="24" r="20" fill="#eb001b"/><circle cx="51" cy="24" r="20" fill="#f79e1b"/><path d="M40 7.3a20 20 0 0 1 0 33.4 20 20 0 0 1 0-33.4Z" fill="#ff5f00"/></svg></div><span className="footer-payment-name">Mastercard</span></li>
    </ul>
    <p className="footer-payment-processor">Processamento pelo <strong>PagBank</strong></p>
  </div>;
}
