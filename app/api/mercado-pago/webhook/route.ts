import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

function assinaturaValida(request: Request, dataId: string) {
  const segredo = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const assinatura = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!segredo || !assinatura || !requestId) return false;
  const partes = Object.fromEntries(assinatura.split(",").map((parte) => parte.trim().split("=")));
  if (!partes.ts || !partes.v1) return false;
  const manifesto = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${partes.ts};`;
  const esperado = createHmac("sha256", segredo).update(manifesto).digest("hex");
  const recebidoBuffer = Buffer.from(partes.v1);
  const esperadoBuffer = Buffer.from(esperado);
  return recebidoBuffer.length === esperadoBuffer.length && timingSafeEqual(recebidoBuffer, esperadoBuffer);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dataId = String(body?.data?.id ?? new URL(request.url).searchParams.get("data.id") ?? "");
    if (!dataId || !assinaturaValida(request, dataId)) return NextResponse.json({ erro: "Notificação inválida." }, { status: 401 });
    if (body?.type && body.type !== "payment") return NextResponse.json({ recebido: true });
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) throw new Error("MERCADO_PAGO_NAO_CONFIGURADO");
    const pagamentoResposta = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000), cache: "no-store" });
    if (!pagamentoResposta.ok) throw new Error("PAGAMENTO_NAO_ENCONTRADO");
    const pagamento = await pagamentoResposta.json();
    if (pagamento.status !== "approved") return NextResponse.json({ recebido: true });
    const pedidoId = Number(pagamento.external_reference);
    if (!Number.isInteger(pedidoId) || pedidoId < 1) throw new Error("PEDIDO_INVALIDO");
    const { error } = await criarClienteAdmin().rpc("confirmar_pagamento", { p_pedido_id: pedidoId, p_pagamento_id: String(pagamento.id), p_valor: Number(pagamento.transaction_amount) });
    if (error) throw error;
    return NextResponse.json({ recebido: true });
  } catch {
    return NextResponse.json({ erro: "Falha ao processar notificação." }, { status: 500 });
  }
}
