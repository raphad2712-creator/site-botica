import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

type ItemRecebido = { produto_id: number; quantidade: number };

export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ erro: "Entre na sua conta antes de finalizar." }, { status: 401 });

  const body = (await request.json()) as { itens?: ItemRecebido[] };
  if (!body.itens?.length) return NextResponse.json({ erro: "Carrinho vazio." }, { status: 400 });

  const ids = [...new Set(body.itens.map((item) => item.produto_id))];
  const { data: produtos, error } = await supabase
    .from("produtos")
    .select("id,nome,preco,estoque,ativo")
    .in("id", ids)
    .eq("ativo", true);

  if (error || !produtos || produtos.length !== ids.length) {
    return NextResponse.json({ erro: "Um produto não está mais disponível." }, { status: 400 });
  }

  let total = 0;
  const itensPedido = body.itens.map((item) => {
    const produto = produtos.find((p) => p.id === item.produto_id)!;
    const quantidade = Math.max(1, Math.floor(item.quantidade));
    if (quantidade > produto.estoque) throw new Error(`Estoque insuficiente para ${produto.nome}`);
    total += Number(produto.preco) * quantidade;
    return { produto_id: produto.id, quantidade, preco_unitario: produto.preco };
  });

  try {
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({ usuario_id: auth.user.id, total, status: "aguardando_pagamento" })
      .select("id")
      .single();
    if (pedidoError) throw pedidoError;

    const { error: itensError } = await supabase
      .from("itens_pedido")
      .insert(itensPedido.map((item) => ({ ...item, pedido_id: pedido.id })));
    if (itensError) throw itensError;

    return NextResponse.json({ pedido_id: pedido.id });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao criar pedido.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}
