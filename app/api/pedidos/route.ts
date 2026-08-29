import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

type ItemRecebido = { produto_id: number; quantidade: number };
type ClienteRecebido = { cep?: string; rua?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; estado?: string };

export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ erro: "Entre na sua conta antes de finalizar." }, { status: 401 });

  const body = (await request.json()) as { itens?: ItemRecebido[]; cliente?: ClienteRecebido; frete?: number };
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

  try {
    let total = 0;
    const itensPedido = body.itens.map((item) => {
      const produto = produtos.find((p) => p.id === item.produto_id)!;
      const quantidade = Math.max(1, Math.floor(Number(item.quantidade)));
      if (!Number.isFinite(quantidade) || quantidade > Number(produto.estoque)) {
        throw new Error(`ESTOQUE:${produto.nome}`);
      }
      total += Number(produto.preco) * quantidade;
      return { produto_id: produto.id, quantidade, preco_unitario: produto.preco };
    });
    let enderecoId: number | null = null;
    if (body.cliente?.cep && body.cliente.rua && body.cliente.numero && body.cliente.bairro && body.cliente.cidade && body.cliente.estado) {
      const { data: endereco, error: enderecoError } = await supabase.from("enderecos").insert({
        usuario_id: auth.user.id,
        cep: body.cliente.cep,
        rua: body.cliente.rua,
        numero: body.cliente.numero,
        complemento: body.cliente.complemento || null,
        bairro: body.cliente.bairro,
        cidade: body.cliente.cidade,
        estado: body.cliente.estado.toUpperCase(),
      }).select("id").single();
      if (enderecoError) throw enderecoError;
      enderecoId = endereco.id;
    }
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({ usuario_id: auth.user.id, endereco_id: enderecoId, total: total + Number(body.frete ?? 0), frete: Number(body.frete ?? 0), status: "aguardando_pagamento" })
      .select("id")
      .single();
    if (pedidoError) throw pedidoError;

    const { error: itensError } = await supabase
      .from("itens_pedido")
      .insert(itensPedido.map((item) => ({ ...item, pedido_id: pedido.id })));
    if (itensError) throw itensError;

    return NextResponse.json({ pedido_id: pedido.id });
  } catch (erro) {
    const codigo = typeof erro === "object" && erro && "code" in erro ? String(erro.code) : "";
    const detalhe = erro instanceof Error ? erro.message : "";
    const mensagem = detalhe.startsWith("ESTOQUE:")
      ? `Estoque insuficiente para ${detalhe.slice(8)}.`
      : codigo === "42P01" || codigo === "PGRST205"
        ? "O banco de pedidos ainda precisa ser configurado no Supabase."
        : "Não foi possível criar o pedido. Tente novamente.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}
