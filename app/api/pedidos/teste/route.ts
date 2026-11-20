import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { aplicarPrecoCatalogo } from "@/lib/consultation-products";
import { comprasLiberadas, segurancaBancoPronta } from "@/lib/launch-readiness";
import { validarItens } from "@/lib/checkout-validation";
import { limiteExcedido, respostaMuitasTentativas } from "@/lib/security";

export async function POST(request: Request) {
  if (await limiteExcedido(request, "pedido-teste", 3, 60)) return respostaMuitasTentativas(60);
  if (await comprasLiberadas()) return NextResponse.json({ erro: "O pagamento real já está disponível. Use o checkout normal." }, { status: 409 });
  if (!await segurancaBancoPronta()) return NextResponse.json({ erro: "A segurança do banco ainda precisa ser verificada para registrar pedidos de teste." }, { status: 503 });

  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ erro: "Entre na sua conta para registrar o pedido de teste." }, { status: 401 });

  let itens: ReturnType<typeof validarItens>;
  try {
    if (Number(request.headers.get("content-length")) > 32768) return NextResponse.json({ erro: "Pedido muito grande." }, { status: 413 });
    const body = await request.text();
    if (new TextEncoder().encode(body).length > 32768) return NextResponse.json({ erro: "Pedido muito grande." }, { status: 413 });
    itens = validarItens(JSON.parse(body)?.itens);
  } catch {
    return NextResponse.json({ erro: "Confira os produtos e as quantidades do carrinho." }, { status: 400 });
  }

  const admin = criarClienteAdmin();
  const { data: produtos, error } = await admin.from("produtos").select("id,nome,preco,ativo").in("id", itens.map((item) => item.produto_id)).eq("ativo", true);
  if (error || !produtos || produtos.length !== itens.length) return NextResponse.json({ erro: "Um produto do carrinho não está mais cadastrado." }, { status: 400 });

  const linhas = itens.map((item) => {
    const produto = produtos.find((produto) => produto.id === item.produto_id)!;
    const atualizado = aplicarPrecoCatalogo(produto);
    return { produto_id: item.produto_id, quantidade: item.quantidade, preco_unitario: Number(atualizado.preco) };
  });
  if (linhas.some((linha) => !Number.isFinite(linha.preco_unitario) || linha.preco_unitario < 0)) {
    return NextResponse.json({ erro: "Não foi possível confirmar os preços dos produtos." }, { status: 400 });
  }
  const total = Number(linhas.reduce((soma, linha) => soma + linha.preco_unitario * linha.quantidade, 0).toFixed(2));
  const marcador = `TESTE-${crypto.randomUUID()}`;
  const { data: pedido, error: pedidoError } = await admin.from("pedidos")
    .insert({ usuario_id: auth.user.id, status: "cancelado", pagamento_id: marcador, total, frete: 0 })
    .select("id").single();
  if (pedidoError || !pedido) return NextResponse.json({ erro: "Não foi possível salvar o pedido de teste." }, { status: 500 });

  const { error: itensError } = await admin.from("itens_pedido").insert(linhas.map((linha) => ({ ...linha, pedido_id: pedido.id })));
  if (itensError) {
    await admin.from("pedidos").delete().eq("id", pedido.id).eq("pagamento_id", marcador);
    return NextResponse.json({ erro: "Não foi possível salvar os itens do pedido de teste." }, { status: 500 });
  }

  return NextResponse.json({ pedido_id: pedido.id, checkout_url: `/pagamento/retorno?pedido=${pedido.id}`, teste: true });
}
