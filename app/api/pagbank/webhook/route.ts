import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

function assinaturaValida(payload: string, assinatura: string | null, token: string) {
  if (!assinatura || !/^[a-f0-9]{64}$/i.test(assinatura)) return false;
  const esperada = createHash("sha256").update(`${token}-${payload}`).digest("hex");
  const recebidaBuffer = Buffer.from(assinatura.toLowerCase(), "utf8");
  const esperadaBuffer = Buffer.from(esperada, "utf8");
  return recebidaBuffer.length === esperadaBuffer.length && timingSafeEqual(recebidaBuffer, esperadaBuffer);
}

export async function POST(request: Request) {
  try {
    const token = process.env.PAGBANK_TOKEN;
    if (!token) throw new Error("PAGBANK_NAO_CONFIGURADO");
    const payload = await request.text();
    if (!assinaturaValida(payload, request.headers.get("x-authenticity-token"), token)) {
      return NextResponse.json({ erro: "Notificação inválida." }, { status: 401 });
    }
    const body = JSON.parse(payload);
    const cobrancas = Array.isArray(body?.charges) ? body.charges : [];
    const cobrancaPaga = cobrancas.find((cobranca: { status?: string }) => cobranca.status === "PAID");
    if (!cobrancaPaga) return NextResponse.json({ recebido: true });

    const pedidoId = Number(body.reference_id);
    const centavos = Number(cobrancaPaga?.amount?.summary?.paid ?? cobrancaPaga?.amount?.value);
    if (!Number.isInteger(pedidoId) || pedidoId < 1 || !Number.isInteger(centavos) || centavos < 0) {
      throw new Error("PAGAMENTO_INVALIDO");
    }
    const { error } = await criarClienteAdmin().rpc("confirmar_pagamento", {
      p_pedido_id: pedidoId,
      p_pagamento_id: String(cobrancaPaga.id),
      p_valor: centavos / 100,
    });
    if (error) throw error;
    return NextResponse.json({ recebido: true });
  } catch (erro) {
    console.error("ERRO_WEBHOOK_PAGBANK", erro);
    return NextResponse.json({ erro: "Falha ao processar notificação." }, { status: 500 });
  }
}
