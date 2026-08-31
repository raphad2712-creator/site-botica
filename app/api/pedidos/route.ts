import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

type ItemRecebido = { produto_id: number; quantidade: number };
type ClienteRecebido = { nome?: string; email?: string; cpf?: string; telefone?: string; cep?: string; rua?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; estado?: string };

function mensagemErro(erro: unknown) {
  const codigo = typeof erro === "object" && erro && "code" in erro ? String(erro.code) : "";
  const detalhe = erro instanceof Error ? erro.message : "";
  if (detalhe.startsWith("ESTOQUE:")) return `Estoque insuficiente para ${detalhe.slice(8)}.`;
  if (detalhe === "DADOS_PIX_INVALIDOS") return "Informe nome, e-mail e um CPF válido para gerar o Pix.";
  if (detalhe === "PIX_RECUSADO") return "Não foi possível gerar o Pix. Confira a credencial de teste do Mercado Pago.";
  if (detalhe === "PAGAMENTO_NAO_CONFIGURADO") return "O pagamento ainda não foi configurado na Vercel.";
  if (detalhe === "SUPABASE_ADMIN_NAO_CONFIGURADO") return "Configure a variável SUPABASE_SERVICE_ROLE_KEY na Vercel e faça um novo deploy.";
  if (codigo === "42P01" || codigo === "PGRST205") return "O banco de pedidos ainda precisa ser configurado no Supabase.";
  return "Não foi possível iniciar o pagamento. Tente novamente.";
}

export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ erro: "Entre na sua conta antes de finalizar." }, { status: 401 });
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const modoPedidoTeste = process.env.MODO_PEDIDO_TESTE === "true" && !!process.env.ADMIN_EMAIL && auth.user.email?.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
  if (!accessToken && !modoPedidoTeste) return NextResponse.json({ erro: mensagemErro(new Error("PAGAMENTO_NAO_CONFIGURADO")) }, { status: 503 });
  const body = (await request.json()) as { itens?: ItemRecebido[]; cliente?: ClienteRecebido; metodo_pagamento?: "pix" | "cartao" };
  if (!body.itens?.length) return NextResponse.json({ erro: "Carrinho vazio." }, { status: 400 });
  const ids = [...new Set(body.itens.map((item) => Number(item.produto_id)))];
  const { data: produtos, error } = await supabase.from("produtos").select("id,nome,preco,estoque,ativo").in("id", ids).eq("ativo", true);
  if (error || !produtos || produtos.length !== ids.length) return NextResponse.json({ erro: "Um produto não está mais disponível." }, { status: 400 });

  let pedidoId: number | null = null;
  let etapa = "validar pedido";
  try {
    etapa = "acessar o banco administrativo";
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

    etapa = "salvar os dados do comprador";
    const { error: perfilError } = await admin.from("perfil_clientes").upsert({
      usuario_id: auth.user.id,
      nome: String(cliente.nome ?? "").trim() || null,
      cpf: String(cliente.cpf ?? "").replace(/\D/g, "").slice(0, 11) || null,
      telefone: String(cliente.telefone ?? "").trim() || null,
      cep: String(cliente.cep).replace(/\D/g, "").slice(0, 8),
      rua: String(cliente.rua).trim(),
      numero: String(cliente.numero).trim(),
      complemento: String(cliente.complemento ?? "").trim() || null,
      bairro: String(cliente.bairro).trim(),
      cidade: String(cliente.cidade).trim(),
      estado: String(cliente.estado).trim().toUpperCase().slice(0, 2),
      atualizado_em: new Date().toISOString(),
    }, { onConflict: "usuario_id" });
    if (perfilError) throw perfilError;

    etapa = "salvar o endereço";
    const { data: endereco, error: enderecoError } = await supabase.from("enderecos").insert({ usuario_id: auth.user.id, cep: cliente.cep, rua: cliente.rua, numero: cliente.numero, complemento: cliente.complemento || null, bairro: cliente.bairro, cidade: cliente.cidade, estado: cliente.estado.toUpperCase() }).select("id").single();
    if (enderecoError) throw enderecoError;
    const total = Number((subtotal + frete).toFixed(2));
    etapa = "criar o pedido";
    const { data: pedido, error: pedidoError } = await supabase.from("pedidos").insert({ usuario_id: auth.user.id, endereco_id: endereco.id, total, frete, status: "aguardando_pagamento" }).select("id").single();
    if (pedidoError) throw pedidoError;
    pedidoId = Number(pedido.id);
    etapa = "salvar os produtos do pedido";
    const { error: itensError } = await supabase.from("itens_pedido").insert(itensPedido.map(({ nome: _nome, ...item }) => ({ ...item, pedido_id: pedido.id })));
    if (itensError) throw itensError;

    // O modo de teste do administrador sempre tem prioridade, mesmo quando já
    // existe uma credencial do Mercado Pago configurada na Vercel.
    if (modoPedidoTeste) {
      etapa = "confirmar o pedido de teste";
      const { error: testeError } = await admin.from("pedidos").update({
        status: "pago",
        pagamento_id: `TESTE-${pedido.id}`,
        pago_em: new Date().toISOString(),
        status_entrega: "preparando",
      }).eq("id", pedido.id);
      if (testeError) throw testeError;
      return NextResponse.json({ pedido_id: pedido.id, tipo: "teste", mensagem: "Pedido de teste finalizado sem cobrança." });
    }

    const origem = new URL(request.url).origin;
    const notificationUrl = origem.startsWith("https://") ? `${origem}/api/mercado-pago/webhook` : undefined;
    if (body.metodo_pagamento === "pix") {
      const cpf = String(cliente.cpf ?? "").replace(/\D/g, "");
      if (cpf.length !== 11 || !cliente.email || !cliente.nome) throw new Error("DADOS_PIX_INVALIDOS");
      const nomes = cliente.nome.trim().split(/\s+/);
      const pagamentoResposta = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "X-Idempotency-Key": `pix-pedido-${pedido.id}` },
        body: JSON.stringify({
          transaction_amount: total,
          description: `Pedido Botica #${pedido.id}`,
          payment_method_id: "pix",
          external_reference: String(pedido.id),
          ...(notificationUrl ? { notification_url: notificationUrl } : {}),
          payer: { email: cliente.email, first_name: nomes[0], last_name: nomes.slice(1).join(" ") || undefined, identification: { type: "CPF", number: cpf } },
        }),
        signal: AbortSignal.timeout(20000),
      });
      const pagamento = await pagamentoResposta.json();
      const transacao = pagamento?.point_of_interaction?.transaction_data;
      if (!pagamentoResposta.ok || !pagamento.id || !transacao?.qr_code) throw new Error("PIX_RECUSADO");
      const { error: pixUpdateError } = await admin.from("pedidos").update({ pagamento_id: String(pagamento.id) }).eq("id", pedido.id);
      if (pixUpdateError) throw pixUpdateError;
      return NextResponse.json({ pedido_id: pedido.id, tipo: "pix", pix: { codigo: transacao.qr_code, qr_code_base64: transacao.qr_code_base64, link: transacao.ticket_url } });
    }

    const itensMercadoPago = itensPedido.map((item) => ({ id: String(item.produto_id), title: item.nome, quantity: item.quantidade, currency_id: "BRL", unit_price: item.preco_unitario }));
    if (frete > 0) itensMercadoPago.push({ id: "frete", title: "Frete", quantity: 1, currency_id: "BRL", unit_price: frete });
    const preferenciaResposta = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "X-Idempotency-Key": `pedido-${pedido.id}` },
      body: JSON.stringify({
        items: itensMercadoPago, external_reference: String(pedido.id), statement_descriptor: "BOTICA BIOENERGETICA",
        payer: { email: cliente.email || auth.user.email, name: cliente.nome }, payment_methods: { installments: 6 },
        back_urls: { success: `${origem}/pagamento/retorno?pedido=${pedido.id}&resultado=sucesso`, pending: `${origem}/pagamento/retorno?pedido=${pedido.id}&resultado=pendente`, failure: `${origem}/pagamento/retorno?pedido=${pedido.id}&resultado=falha` },
        auto_return: "approved", ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      }),
      signal: AbortSignal.timeout(20000),
    });
    const preferencia = await preferenciaResposta.json();
    if (!preferenciaResposta.ok || !preferencia.id) throw new Error("PREFERENCIA_RECUSADA");
    const { error: updateError } = await admin.from("pedidos").update({ mercado_pago_preference_id: preferencia.id }).eq("id", pedido.id);
    if (updateError) throw updateError;
    const checkoutUrl = process.env.MERCADO_PAGO_MODO_TESTE === "false" ? preferencia.init_point : preferencia.sandbox_init_point;
    return NextResponse.json({ pedido_id: pedido.id, checkout_url: checkoutUrl });
  } catch (erro) {
    console.error("ERRO_CRIAR_PEDIDO", { etapa, pedidoId, erro });
    if (pedidoId) { try { await criarClienteAdmin().from("pedidos").update({ status: "cancelado" }).eq("id", pedidoId); } catch { /* mantém o erro original */ } }
    const detalhe = erro instanceof Error
      ? erro.message
      : typeof erro === "object" && erro && "message" in erro
        ? String(erro.message)
        : "erro desconhecido";
    const mensagem = modoPedidoTeste
      ? `Teste — falha ao ${etapa}: ${detalhe}`
      : mensagemErro(erro);
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}
