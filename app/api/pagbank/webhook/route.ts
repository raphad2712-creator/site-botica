import { segurancaBancoPronta } from "@/lib/launch-readiness";
import { createHash, createPublicKey, timingSafeEqual, verify } from "node:crypto";
import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

function assinaturaValida(payload: string, assinatura: string | null, token: string) {
  if (!assinatura || !/^[a-f0-9]{64}$/i.test(assinatura)) return false;
  const esperada = createHash("sha256").update(`${token}-${payload}`).digest("hex");
  const recebidaBuffer = Buffer.from(assinatura.toLowerCase(), "utf8");
  const esperadaBuffer = Buffer.from(esperada, "utf8");
  return recebidaBuffer.length === esperadaBuffer.length && timingSafeEqual(recebidaBuffer, esperadaBuffer);
}

let chaveEmCache: { chave: string; expiraEm: number } | undefined;

async function buscarChavePublica(token: string, atualizar = false) {
  const configurada = process.env.PAGBANK_WEBHOOK_PUBLIC_KEY?.trim();
  if (configurada) return configurada;
  if (!atualizar && chaveEmCache && chaveEmCache.expiraEm > Date.now()) return chaveEmCache.chave;
  const base = process.env.PAGBANK_SANDBOX === "false"
    ? "https://api.pagseguro.com"
    : "https://sandbox.api.pagseguro.com";
  const resposta = await fetch(`${base}/public-keys?type=webhook`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(6000),
  });
  if (!resposta.ok) throw new Error(`PAGBANK_CHAVE_PUBLICA_${resposta.status}`);
  const corpo = await resposta.json();
  if (typeof corpo.public_key !== "string" || !/^[a-zA-Z0-9+/]+={0,2}$/.test(corpo.public_key)) {
    throw new Error("PAGBANK_CHAVE_PUBLICA_INVALIDA");
  }
  // Confere o formato X.509 antes de colocá-la em cache.
  createPublicKey({ key: Buffer.from(corpo.public_key, "base64"), format: "der", type: "spki" });
  chaveEmCache = { chave: corpo.public_key, expiraEm: Date.now() + 60 * 60 * 1000 };
  return corpo.public_key;
}

function verificarAssinaturas(payload: Buffer, cabecalho: string, chave: string) {
  const publica = createPublicKey({ key: Buffer.from(chave, "base64"), format: "der", type: "spki" });
  return cabecalho.split(",").some((valor) => {
    const assinatura = valor.trim();
    if (!/^[a-zA-Z0-9+/]+={0,2}$/.test(assinatura)) return false;
    try { return verify("sha256", payload, publica, Buffer.from(assinatura, "base64")); }
    catch { return false; }
  });
}

export async function POST(request: Request) {
  try {
    const token = process.env.PAGBANK_TOKEN;
    if (!token) return NextResponse.json({ erro: "Serviço temporariamente indisponível." }, { status: 503 });
    if (Number(request.headers.get("content-length")) > 65536) return NextResponse.json({ erro: "Notificação muito grande." }, { status: 413 });
    const bruto = Buffer.from(await request.arrayBuffer());
    if (bruto.length > 65536) return NextResponse.json({ erro: "Notificação muito grande." }, { status: 413 });
    const assinaturaNova = request.headers.get("x-payload-signature");
    let autenticada = false;
    if (assinaturaNova) {
      const haviaCache = Boolean(chaveEmCache && chaveEmCache.expiraEm > Date.now());
      const chave = await buscarChavePublica(token);
      autenticada = verificarAssinaturas(bruto, assinaturaNova, chave);
      // Uma chave renovada pode invalidar o cache anterior.
      if (!autenticada && haviaCache && !process.env.PAGBANK_WEBHOOK_PUBLIC_KEY) {
        const atualizada = await buscarChavePublica(token, true);
        autenticada = verificarAssinaturas(bruto, assinaturaNova, atualizada);
      }
    } else {
      autenticada = assinaturaValida(bruto.toString("utf8"), request.headers.get("x-authenticity-token"), token);
    }
    if (!autenticada) {
      return NextResponse.json({ erro: "Notificação inválida." }, { status: 401 });
    }
    if (!await segurancaBancoPronta()) return NextResponse.json({ erro: "Serviço temporariamente indisponível." }, { status: 503 });
    const body = JSON.parse(bruto.toString("utf8"));
    const cobrancas = Array.isArray(body?.charges) ? body.charges : [];
    const cobrancaPaga = cobrancas.find((cobranca: { status?: string }) => cobranca.status === "PAID");
    const pedidoId = Number(body.reference_id);
    // Uma tentativa recusada no checkout não cancela o pedido: o cliente pode tentar outro meio.
    if (!cobrancaPaga) return NextResponse.json({ recebido: true });

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
