import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { enviarEmail, escaparHtml } from "@/lib/email";
import { consultarFrete } from "@/lib/frete";

type ItemRecebido = { produto_id: number; quantidade: number };
type ClienteRecebido = { nome?: string; email?: string; cpf?: string; telefone?: string; cep?: string; rua?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; estado?: string };

async function avisarLojaNovoPedido({ pedidoId, cliente, itens, subtotal, frete, total, pagamento }: { pedidoId: number; cliente: ClienteRecebido; itens: Array<{ nome: string; quantidade: number; preco_unitario: number }>; subtotal: number; frete: number; total: number; pagamento: string }) {
  const emailLoja = process.env.ADMIN_EMAIL || process.env.EMAIL_REMETENTE;
  if (!emailLoja) return;
  const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const lista = itens.map((item) => `<tr><td style="padding:8px;border-bottom:1px solid #ddd">${escaparHtml(item.nome)}</td><td style="padding:8px;border-bottom:1px solid #ddd">${item.quantidade}</td><td style="padding:8px;border-bottom:1px solid #ddd">${moeda(item.preco_unitario * item.quantidade)}</td></tr>`).join("");
  try {
    await enviarEmail({
      para: emailLoja,
      assunto: `Nova compra na Botica — pedido #${pedidoId}`,
      html: `<h2>Nova compra recebida</h2><p><b>Pedido:</b> ${String(pedidoId).padStart(6, "0")}</p><p><b>Cliente:</b> ${escaparHtml(cliente.nome || "Não informado")}<br><b>E-mail:</b> ${escaparHtml(cliente.email || "Não informado")}<br><b>Telefone:</b> ${escaparHtml(cliente.telefone || "Não informado")}</p><table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:8px;text-align:left">Produto</th><th style="padding:8px;text-align:left">Qtd.</th><th style="padding:8px;text-align:left">Valor</th></tr></thead><tbody>${lista}</tbody></table><p><b>Subtotal:</b> ${moeda(subtotal)}<br><b>Frete:</b> ${frete ? moeda(frete) : "Grátis"}<br><b>Total:</b> ${moeda(total)}<br><b>Pagamento:</b> ${escaparHtml(pagamento)}</p><p><b>Entrega:</b> ${escaparHtml(cliente.rua)}, ${escaparHtml(cliente.numero)} — ${escaparHtml(cliente.bairro)}, ${escaparHtml(cliente.cidade)}/${escaparHtml(cliente.estado)} — CEP ${escaparHtml(cliente.cep)}</p><p>Acesse o painel administrativo para acompanhar e preparar o pedido.</p>`,
    });
  } catch (erro) {
    console.error("ERRO_EMAIL_NOVO_PEDIDO", { pedidoId, erro });
  }
}

function mensagemErro(erro: unknown) {
  const codigo = typeof erro === "object" && erro && "code" in erro ? String(erro.code) : "";
  const detalhe = erro instanceof Error ? erro.message : "";
  if (detalhe.startsWith("ESTOQUE:")) return `Estoque insuficiente para ${detalhe.slice(8)}.`;
  if (detalhe === "DADOS_PAGAMENTO_INVALIDOS") return "Informe nome, e-mail e um CPF válido para continuar ao PagBank.";
  if (detalhe === "CHECKOUT_RECUSADO") return "Não foi possível abrir o PagBank. Confira o token e o ambiente configurados.";
  if (detalhe === "PAGAMENTO_NAO_CONFIGURADO") return "O pagamento ainda não foi configurado na Vercel.";
  if (detalhe === "CEP_INVALIDO" || detalhe === "CEP_NAO_ENCONTRADO") return "O CEP de entrega não foi encontrado.";
  if (detalhe === "CEP_INDISPONIVEL") return "Não foi possível confirmar o frete agora. Tente novamente.";
  if (detalhe === "SUPABASE_ADMIN_NAO_CONFIGURADO") return "Configure a variável SUPABASE_SERVICE_ROLE_KEY na Vercel e faça um novo deploy.";
  if (codigo === "42P01" || codigo === "PGRST205") return "O banco de pedidos ainda precisa ser configurado no Supabase.";
  return "Não foi possível iniciar o pagamento. Tente novamente.";
}

export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ erro: "Entre na sua conta antes de finalizar." }, { status: 401 });
  const accessToken = process.env.PAGBANK_TOKEN;
  const modoPedidoTeste = process.env.MODO_PEDIDO_TESTE === "true" && !!process.env.ADMIN_EMAIL && auth.user.email?.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
  if (!accessToken && !modoPedidoTeste) return NextResponse.json({ erro: mensagemErro(new Error("PAGAMENTO_NAO_CONFIGURADO")) }, { status: 503 });
  const body = (await request.json()) as { itens?: ItemRecebido[]; cliente?: ClienteRecebido; metodo_pagamento?: "pix" | "cartao" };
  if (!body.itens?.length) return NextResponse.json({ erro: "Carrinho vazio." }, { status: 400 });
  if (body.metodo_pagamento !== "pix" && body.metodo_pagamento !== "cartao") return NextResponse.json({ erro: "Escolha Pix ou cartão de crédito." }, { status: 400 });
  const ids = [...new Set(body.itens.map((item) => Number(item.produto_id)))];
  let { data: produtos, error } = await supabase.from("produtos").select("id,nome,preco,estoque,ativo,peso_kg,altura_cm,largura_cm,comprimento_cm").in("id", ids).eq("ativo", true);
  if (error) {
    const consultaLegada = await supabase.from("produtos").select("id,nome,preco,estoque,ativo").in("id", ids).eq("ativo", true);
    produtos = consultaLegada.data?.map((produto) => ({ ...produto, peso_kg: null, altura_cm: null, largura_cm: null, comprimento_cm: null })) ?? null;
    error = consultaLegada.error;
  }
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
    const cliente = body.cliente ?? {};
    if (!cliente.cep || !cliente.rua || !cliente.numero || !cliente.bairro || !cliente.cidade || !cliente.estado) return NextResponse.json({ erro: "Preencha o endereço de entrega." }, { status: 400 });
    etapa = "confirmar o frete";
    const cotacaoFrete = await consultarFrete(cliente.cep, subtotal, itensPedido.map((item) => {
      const produto = produtos.find((atual) => Number(atual.id) === Number(item.produto_id))!;
      return {
        id: produto.id, nome: produto.nome, preco: Number(produto.preco), quantidade: item.quantidade,
        peso_kg: produto.peso_kg === null ? null : Number(produto.peso_kg),
        altura_cm: produto.altura_cm === null ? null : Number(produto.altura_cm),
        largura_cm: produto.largura_cm === null ? null : Number(produto.largura_cm),
        comprimento_cm: produto.comprimento_cm === null ? null : Number(produto.comprimento_cm),
      };
    }));
    const frete = cotacaoFrete.valor;

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
    const { data: pedido, error: pedidoError } = await supabase.from("pedidos").insert({ usuario_id: auth.user.id, endereco_id: endereco.id, total, frete, transportadora: `${cotacaoFrete.transportadora} — ${cotacaoFrete.servico}`, status: "aguardando_pagamento" }).select("id").single();
    if (pedidoError) throw pedidoError;
    pedidoId = Number(pedido.id);
    etapa = "salvar os produtos do pedido";
    const { error: itensError } = await supabase.from("itens_pedido").insert(itensPedido.map(({ nome: _nome, ...item }) => ({ ...item, pedido_id: pedido.id })));
    if (itensError) throw itensError;

    // O modo de teste do administrador sempre tem prioridade, mesmo quando já
    // existe uma credencial do PagBank configurada na Vercel.
    if (modoPedidoTeste) {
      etapa = "confirmar o pedido de teste";
      const { error: testeError } = await admin.from("pedidos").update({
        status: "pago",
        pagamento_id: `TESTE-${pedido.id}`,
        pago_em: new Date().toISOString(),
        status_entrega: "preparando",
      }).eq("id", pedido.id);
      if (testeError) throw testeError;
      await avisarLojaNovoPedido({ pedidoId: pedido.id, cliente, itens: itensPedido, subtotal, frete, total, pagamento: "Pedido de teste confirmado" });
      return NextResponse.json({ pedido_id: pedido.id, tipo: "teste", mensagem: "Pedido de teste finalizado sem cobrança." });
    }

    const cpf = String(cliente.cpf ?? "").replace(/\D/g, "");
    const pagamentoCartao = body.metodo_pagamento === "cartao";
    if (cpf.length !== 11 || !cliente.email || !cliente.nome) throw new Error("DADOS_PAGAMENTO_INVALIDOS");
    const origem = new URL(request.url).origin;
    const notificationUrl = origem.startsWith("https://") ? `${origem}/api/pagbank/webhook` : undefined;
    const apiBase = process.env.PAGBANK_SANDBOX === "false"
      ? "https://api.pagseguro.com"
      : "https://sandbox.api.pagseguro.com";
    const checkoutResposta = await fetch(`${apiBase}/checkouts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        reference_id: String(pedido.id),
        customer: { name: cliente.nome.trim(), email: cliente.email.trim(), tax_id: cpf },
        customer_modifiable: true,
        items: itensPedido.map((item) => ({
          reference_id: String(item.produto_id),
          name: item.nome.slice(0, 100),
          quantity: item.quantidade,
          unit_amount: Math.round(item.preco_unitario * 100),
        })),
        shipping: {
          type: frete > 0 ? "FIXED" : "FREE",
          ...(frete > 0 ? { amount: Math.round(frete * 100) } : {}),
          address_modifiable: false,
          address: {
            country: "BRA",
            region_code: String(cliente.estado).trim().toUpperCase().slice(0, 2),
            city: String(cliente.cidade).trim().slice(0, 90),
            postal_code: String(cliente.cep).replace(/\D/g, "").slice(0, 8),
            street: String(cliente.rua).trim().slice(0, 160),
            number: String(cliente.numero).trim().slice(0, 20),
            locality: String(cliente.bairro).trim().slice(0, 60),
            complement: String(cliente.complemento ?? "").trim() || undefined,
          },
        },
        payment_methods: [{ type: pagamentoCartao ? "CREDIT_CARD" : "PIX" }],
        ...(pagamentoCartao ? { payment_methods_configs: [{
          type: "CREDIT_CARD",
          config_options: [
            { option: "INSTALLMENTS_LIMIT", value: "6" },
            { option: "INTEREST_FREE_INSTALLMENTS", value: "6" },
          ],
        }] } : {}),
        soft_descriptor: "BOTICA BIO",
        redirect_url: `${origem}/pagamento/retorno?pedido=${pedido.id}&resultado=pendente`,
        return_url: `${origem}/pagamento/retorno?pedido=${pedido.id}&resultado=falha`,
        redirect_waiting_time: 5,
        ...(notificationUrl ? { notification_urls: [notificationUrl], payment_notification_urls: [notificationUrl] } : {}),
      }),
      signal: AbortSignal.timeout(20000),
    });
    const checkout = await checkoutResposta.json();
    const checkoutUrl = checkout?.links?.find((link: { rel?: string; href?: string }) => link.rel === "PAY")?.href;
    if (!checkoutResposta.ok || !checkout?.id || !checkoutUrl) {
      console.error("ERRO_CHECKOUT_PAGBANK", { status: checkoutResposta.status, pedidoId: pedido.id, resposta: checkout });
      throw new Error("CHECKOUT_RECUSADO");
    }
    await avisarLojaNovoPedido({ pedidoId: pedido.id, cliente, itens: itensPedido, subtotal, frete, total, pagamento: `${pagamentoCartao ? "Cartão de crédito" : "Pix"} — aguardando confirmação` });
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
