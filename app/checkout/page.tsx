import { comprasLiberadas } from "@/lib/launch-readiness";
import CheckoutForm from "./checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const liberado = await comprasLiberadas();
  return <CheckoutForm modoTeste={!liberado} />;
}
