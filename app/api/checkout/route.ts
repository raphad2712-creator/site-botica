import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const dados = await request.json();
    if (!dados?.cliente?.nome || !dados?.cliente?.email || !dados?.cliente?.cep) return NextResponse.json({ erro: "Preencha seus dados e o endereço." }, { status: 400 });
    if (!Array.isArray(dados.itens) || !dados.itens.length) return NextResponse.json({ erro: "O carrinho está vazio." }, { status: 400 });
    const numero = Math.floor(100000 + Math.random() * 900000);
    return NextResponse.json({ sucesso: true, pedido: numero, mensagem: `Pedido demonstrativo #${numero} criado com sucesso. Nenhuma cobrança foi realizada.` });
  } catch {
    return NextResponse.json({ erro: "Dados do checkout inválidos." }, { status: 400 });
  }
}
