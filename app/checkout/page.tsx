import { comprasLiberadas } from "@/lib/launch-readiness";
import Link from "next/link";
import CheckoutForm from "./checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const disponivel = await comprasLiberadas();
  if (!disponivel) return <section className="empty-page" role="status"><h1>Pagamento online temporariamente indisponível</h1><p>Seu carrinho continua salvo. Fale com a Botica para receber ajuda com sua compra.</p><a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "flavio_farmaceutico@hotmail.com"}?subject=Ajuda%20com%20minha%20compra`}>FALAR COM A BOTICA</a><p><Link href="/carrinho">Voltar ao carrinho</Link></p></section>;
  return <CheckoutForm />;
}
