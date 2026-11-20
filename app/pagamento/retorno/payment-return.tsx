"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/cart-provider";
import { Icon } from "@/components/ui-icon";

export function PaymentReturn({ resultado, pedido }: { resultado: "sucesso" | "pendente" | "falha" | "teste"; pedido?: string }) {
  const { limpar } = useCart();
  useEffect(() => { if (resultado === "sucesso" || resultado === "teste") limpar(); }, [resultado]);
  const conteudo = resultado === "teste" ? { icone: "check" as const, titulo: "Pedido registrado", texto: "Recebemos seus dados e o valor estimado da entrega. O pagamento online ainda está em configuração. A Botica orientará você antes de qualquer cobrança." } : resultado === "sucesso" ? { icone: "check" as const, titulo: "Pagamento confirmado!", texto: "O pagamento foi confirmado e seu pedido seguirá para preparação." } : resultado === "pendente" ? { icone: "clock" as const, titulo: "Aguardando confirmação", texto: "Seu pedido será atualizado automaticamente quando o PagBank confirmar o pagamento." } : { icone: "document" as const, titulo: "Pagamento não concluído", texto: "Nenhum pagamento foi confirmado. Você pode voltar ao checkout e tentar novamente." };
  return <section className={`checkout-success payment-${resultado}`}><span><Icon name={conteudo.icone} /></span><small>PEDIDO {pedido ? `#${pedido}` : "BOTICA"}</small><h1>{conteudo.titulo}</h1><p>{conteudo.texto}</p><Link href="/minha-conta">ACOMPANHAR MEU PEDIDO</Link>{resultado === "falha" && <Link className="return-cart" href="/checkout">TENTAR NOVAMENTE</Link>}</section>;
}
