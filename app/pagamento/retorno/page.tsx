import { PaymentReturn } from "./payment-return";

export default async function RetornoPagamento({ searchParams }: { searchParams: Promise<{ resultado?: string; pedido?: string; status?: string }> }) {
  const parametros = await searchParams;
  const resultado = parametros.status === "approved" || parametros.resultado === "sucesso" ? "sucesso" : parametros.status === "pending" || parametros.resultado === "pendente" ? "pendente" : "falha";
  return <PaymentReturn resultado={resultado} pedido={parametros.pedido} />;
}
