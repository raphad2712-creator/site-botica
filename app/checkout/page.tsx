import Link from "next/link";
import CheckoutForm from "./checkout-form";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  const disponivel = Boolean(process.env.PAGBANK_TOKEN && process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!disponivel) return <section className="empty-page" role="status"><h1>Pagamento online temporariamente indisponível</h1><p>Seu carrinho continua salvo. Fale com a Botica para receber ajuda com sua compra.</p><a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "contato@boticabioenergetica.com.br"}?subject=Ajuda%20com%20minha%20compra`}>FALAR COM A BOTICA</a><p><Link href="/carrinho">Voltar ao carrinho</Link></p></section>;
  return <>{process.env.PAGBANK_SANDBOX !== "false" && <p className="payment-environment-notice" role="status">Ambiente de testes: este checkout não realiza pagamentos reais.</p>}<CheckoutForm /></>;
}
