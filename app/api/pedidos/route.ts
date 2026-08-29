import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

type ItemRecebido = { produto_id: number; quantidade: number };
type ClienteRecebido = { nome?: string; email?: string; cpf?: string; telefone?: string; cep?: string; rua?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; estado?: string };

function mensagemErro(erro: unknown) {
  const codigo = typeof erro === "object" && erro && "code" in erro ? String(erro.code) : "";
  const detalhe = erro instanceof Error ? erro.message : "";
  if (detalhe.startsWith("ESTOQUE:")) return `Estoque insuficiente para ${detalhe.slice(8)}.`;
  if (detalhe === "PAGAMENTO_NAO_CONFIGURADO") return "O pagamento ainda não foi configurado na Vercel.";
  if (codigo === "42P01" || codigo === "PGRST205") return "O banco de pedidos ainda precisa ser configurado no Supabase.";
  return "Não foi possível iniciar o pagamento. Tente novamente.";
}

export async function POST(request: Request) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) return NextResponse.json({ erro: mensagemErro(new Error("PAGAMENTO_NAO_CONFIGURADO")) }, { status: 503 });
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ erro: "Entre na sua conta antes de finalizar." }, { status: 401 });
  const body = (await request.json()) as { itens?: ItemRecebido[]; cliente?: ClienteRecebido };
  if (!body.itens?.length) return NextResponse.json({ erro: "Carrinho vazio." }, { status: 400 });
  const ids = [...new Set(body.itens.map((item) => Number(item.produto_id)))];
  const { data: produtos, error } = await supabase.from("produtos").select("id,nome,preco,estoque,ativo").in("id", ids).eq("ativo", true);
  if (error || !produtos || produtos.length !== ids.length) return NextResponse.json({ erro: "Um produto não está mais disponível." }, { status: 400 });

  let pedidoId: number | null = null;
  try {
    const admin = criarClienteAdmin();
    let subtotal = 0;
    const itensPedido = body.itens.map((item) => {
      const produto = produtos.find((p) => Number(p.id) === Number(item.produto_id))!;
      const quantidade = Math.max(1, Math.floor(Number(item.quantidade)));
      if (!Number.isFinite(quantidade) || quantidade > Number(produto.estoque)) throw new Error(`ESTOQUE:${produto.nome}`);
      subtotal += Number(produto.preco) * quantidade;
      return { produto_id: produto.id, nome: produto.nome, quantidade, preco_unitario: Number(produto.preco) };
    });
    const frete = subtotal >= 210 ? 0 : 18.9;
    const cliente = body.cliente ?? {};
    if (!cliente.cep || !cliente.rua || !cliente.numero || !cliente.bairro || !cliente.cidade || !cliente.estado) return NextResponse.json({ erro: "Preencha o endereço de entrega." }, { status: 400 });

    const { data: endereco, error: enderecoError } = await supabase.from("enderecos").insert({ usuario_id: auth.user.id, cep: cliente.cep, rua: cliente.rua, numero: cliente.numero, complemento: cliente.complemento || null, bairro: cliente.bairro, cidade: cliente.cidade, estado: cliente.estado.toUpperCase() }).select("id").single();
    if (enderecoError) throw enderecoError;
    const total = Number((subtotal + frete).toFixed(2));
    const { data: pedido, error: pedidoError } = await supabase.from("pedidos").insert({ usuario_id: auth.user.id, endereco_id: endereco.id, total, frete, status: "aguardando_pagamento" }).select("id").single();
    if (pedidoError) throw pedidoError;
    pedidoId = Number(pedido.id);
    const { error: itensError } = await supabase.from("itens_pedido").insert(itensPedido.map(({ nome: _nome, ...item }) => ({ ...item, pedido_id: pedido.id })));
    if (itensError) throw itensError;

    const origem = new URL(request.url).origin;
    const itensMercadoPago = itensPedido.map((item) => ({ id: String(item.produto_id), title: item.nome, quantity: item.quantidade, currency_id: "BRL", unit_price: item.preco_unitario }));
    if (frete > 0) itensMercadoPago.push({ id: "frete", title: "Frete", quantity: 1, currency_id: "BRL", unit_price: frete });
    const preferenciaResposta = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "X-Idempotency-Key": `pedido-${pedido.id}` },
      body: JSON.stringify({
        items: itensMercadoPago, external_reference: String(pedido.id), statement_descriptor: "BOTICA BIOENERGETICA",
        payer: { email: cliente.email || auth.user.email, name: cliente.nome }, payment_methods: { installments: 6 },
        back_urls: { success: `${origem}/pagamento/retorno?pedido=${pedido.id}&resultado=sucesso`, pending: `${origem}/pagamento/retorno?pedido=${pedido.id}&resultado=pendente`, failure: `${origem}/pagamento/retorno?pedido=${pedido.id}&resultado=falha` },
        auto_return: "approved", ...(origem.startsWith("https://") ? { notification_url: `${origem}/api/mercado-pago/webhook` } : {}),
      }),
      signal: AbortSignal.timeout(20000),
    });
    const preferencia = await preferenciaResposta.json();
    if (!preferenciaResposta.ok || !preferencia.id) throw new Error("PREFERENCIA_RECUSADA");
    const { error: updateError } = await admin.from("pedidos").update({ mercado_pago_preference_id: preferencia.id }).eq("id", pedido.id);
    if (updateError) throw updateError;
    const checkoutUrl = accessToken.startsWith("TEST-") ? preferencia.sandbox_init_point : preferencia.init_point;
    return NextResponse.json({ pedido_id: pedido.id, checkout_url: checkoutUrl });
  } catch (erro) {
    if (pedidoId) { try { await criarClienteAdmin().from("pedidos").update({ status: "cancelado" }).eq("id", pedidoId); } catch { /* mantém o erro original */ } }
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 400 });
  }
}
