import { NextResponse } from "next/server";
import { consultarFrete } from "@/lib/frete";

function mensagemFrete(erro: unknown) {
  const codigo = erro instanceof Error ? erro.message : "";
  if (codigo === "CEP_INVALIDO") return { mensagem: "Digite um CEP válido com 8 números.", status: 400 };
  if (codigo === "CEP_NAO_ENCONTRADO") return { mensagem: "CEP não encontrado. Confira os números digitados.", status: 404 };
  return { mensagem: "Não foi possível consultar o CEP agora. Tente novamente.", status: 503 };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { cep?: string; subtotal?: number };
    const cotacao = await consultarFrete(String(body.cep || ""), Number(body.subtotal));
    return NextResponse.json(cotacao);
  } catch (erro) {
    const resposta = mensagemFrete(erro);
    return NextResponse.json({ erro: resposta.mensagem }, { status: resposta.status });
  }
}
