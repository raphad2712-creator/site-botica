import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { aplicarPrecoCatalogo } from "@/lib/consultation-products";
import { comprasLiberadas, segurancaBancoPronta } from "@/lib/launch-readiness";
import { validarItens, validarCliente } from "@/lib/checkout-validation";
import { consultarFrete } from "@/lib/frete";
import { limiteExcedido, respostaMuitasTentativas } from "@/lib/security";

export async function POST(request: Request) {
  if (await limiteExcedido(request, "pedido-teste", 3, 60)) return respostaMuitasTentativas(60);
  if (await comprasLiberadas()) return NextResponse.json({ erro: "O pagamento real já está disponível. Use o checkout normal." }, { status: 409 });
  if (!await segurancaBancoPronta()) return NextResponse.json({ erro: "A segurança do banco ainda precisa ser verificada para registrar pedidos." }, { status: 503 });

  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ erro: "Entre na sua conta para registrar o pedido." }, { status: 401 });

  let itens: ReturnType<typeof validarItens>;
  let metodoPagamento: "pix" | "cartao";
  let cliente: ReturnType<typeof validarCliente>;
  try {
    if (Number(request.headers.get("content-length")) > 32768) return NextResponse.json({ erro: "Pedido muito grande." }, { status: 413 });
    const body = await request.text();
    if (new TextEncoder().encode(body).length > 32768) return NextResponse.json({ erro: "Pedido muito grande." }, { status: 413 });
    const dados = JSON.parse(body);
    itens = validarItens(dados?.itens);
    cliente = validarCliente(dados?.cliente);
    if (dados?.metodo_pagamento !== "pix" && dados?.metodo_pagamento !== "cartao") throw new Error("Método inválido");
    metodoPagamento = dados.metodo_pagamento;
  } catch {
    return NextResponse.json({ erro: "Confira os produtos e as quantidades do carrinho." }, { status: 400 });
  }

  const admin = criarClienteAdmin();
  let { data: produtos, error } = await admin.from("produtos").select("id,nome,preco,ativo,peso_kg,altura_cm,largura_cm,comprimento_cm").in("id", itens.map((item) => item.produto_id)).eq("ativo", true);
  if (error) {
    const legado = await admin.from("produtos").select("id,nome,preco,ativo").in("id", itens.map((item) => item.produto_id)).eq("ativo", true);
    produtos = legado.data?.map((produto) => ({ ...produto, peso_kg: null, altura_cm: null, largura_cm: null, comprimento_cm: null })) ?? null;
    error = legado.error;
  }
  if (error || !produtos || produtos.length !== itens.length) return NextResponse.json({ erro: "Um produto do carrinho não está mais cadastrado." }, { status: 400 });

  const linhas = itens.map((item) => {
    const produto = produtos.find((produto) => produto.id === item.produto_id)!;
    const atualizado = aplicarPrecoCatalogo(produto);
    return { produto_id: item.produto_id, quantidade: item.quantidade, preco_unitario: Number(atualizado.preco) };
  });
  if (linhas.some((linha) => !Number.isFinite(linha.preco_unitario) || linha.preco_unitario < 0)) {
    return NextResponse.json({ erro: "Não foi possível confirmar os preços dos produtos." }, { status: 400 });
  }
  const subtotal = Number(linhas.reduce((soma, linha) => soma + linha.preco_unitario * linha.quantidade, 0).toFixed(2));
  let cotacao;
  try {
    cotacao = await consultarFrete(cliente.cep, subtotal, linhas.map((linha) => {
      const produto = produtos.find((atual) => Number(atual.id) === linha.produto_id)!;
      return {
        id: linha.produto_id, nome: produto.nome, preco: linha.preco_unitario, quantidade: linha.quantidade,
        peso_kg: produto.peso_kg === null ? null : Number(produto.peso_kg),
        altura_cm: produto.altura_cm === null ? null : Number(produto.altura_cm),
        largura_cm: produto.largura_cm === null ? null : Number(produto.largura_cm),
        comprimento_cm: produto.comprimento_cm === null ? null : Number(produto.comprimento_cm),
      };
    }));
  } catch {
    return NextResponse.json({ erro: "Não foi possível calcular o frete para este CEP. Confira o endereço e tente novamente." }, { status: 503 });
  }
  const frete = cotacao.valor;
  const total = Number((subtotal + frete).toFixed(2));
  const { data: endereco, error: enderecoError } = await admin.from("enderecos").insert({
    usuario_id: auth.user.id, cep: cliente.cep, rua: cliente.rua, numero: cliente.numero,
    complemento: cliente.complemento || null, bairro: cliente.bairro, cidade: cliente.cidade,
    estado: cliente.estado.toUpperCase(),
  }).select("id").single();
  if (enderecoError || !endereco) return NextResponse.json({ erro: "Não foi possível salvar o endereço de entrega." }, { status: 500 });
  const marcador = `TESTE-${metodoPagamento.toUpperCase()}-${crypto.randomUUID()}`;
  const { data: pedido, error: pedidoError } = await admin.from("pedidos")
    .insert({ usuario_id: auth.user.id, endereco_id: endereco.id, status: "cancelado", pagamento_id: marcador, total, frete, transportadora: `${cotacao.transportadora} — ${cotacao.servico}` })
    .select("id").single();
  if (pedidoError || !pedido) {
    await admin.from("enderecos").delete().eq("id", endereco.id).eq("usuario_id", auth.user.id);
    return NextResponse.json({ erro: "Não foi possível salvar o pedido." }, { status: 500 });
  }

  const { error: itensError } = await admin.from("itens_pedido").insert(linhas.map((linha) => ({ ...linha, pedido_id: pedido.id })));
  if (itensError) {
    await admin.from("pedidos").delete().eq("id", pedido.id).eq("pagamento_id", marcador);
    await admin.from("enderecos").delete().eq("id", endereco.id).eq("usuario_id", auth.user.id);
    return NextResponse.json({ erro: "Não foi possível salvar os itens do pedido." }, { status: 500 });
  }

  return NextResponse.json({ pedido_id: pedido.id, checkout_url: `/pagamento/retorno?pedido=${pedido.id}` });
}
