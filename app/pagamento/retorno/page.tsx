import { PaymentReturn } from "./payment-return";
import { criarClienteServidor } from "@/lib/supabase/server";

export default async function RetornoPagamento({ searchParams }: { searchParams: Promise<{ resultado?: string; pedido?: string; status?: string }> }) {
  const parametros = await searchParams;
  let resultado: "sucesso" | "pendente" | "falha" | "teste" = parametros.resultado === "falha" ? "falha" : "pendente";
  const pedidoId = Number(parametros.pedido);
  if (Number.isInteger(pedidoId) && pedidoId > 0) {
    const supabase = await criarClienteServidor();
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const { data: pedido } = await supabase.from("pedidos").select("status,pagamento_id").eq("id", pedidoId).eq("usuario_id", auth.user.id).maybeSingle();
      if (pedido?.pagamento_id?.startsWith("TESTE-")) resultado = "teste";
      else if (pedido?.status === "pago") resultado = "sucesso";
      else if (pedido?.status === "cancelado") resultado = "falha";
    }
  }
  return <PaymentReturn resultado={resultado} pedido={parametros.pedido} />;
}
