import { NextResponse } from "next/server";

// Pedidos reais passam exclusivamente pela rota autenticada /api/pedidos.
export async function POST() {
  return NextResponse.json({ erro: "Este checkout foi desativado. Finalize sua compra pelo carrinho." }, { status: 410 });
}
