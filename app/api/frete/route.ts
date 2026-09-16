import { NextResponse } from "next/server";
import { consultarFrete, type ProdutoFrete } from "@/lib/frete";
import { criarClienteServidor } from "@/lib/supabase/server";

function mensagemFrete(erro: unknown) {
  const codigo = erro instanceof Error ? erro.message : "";
  if (codigo === "CEP_INVALIDO") return { mensagem: "Digite um CEP válido com 8 números.", status: 400 };
  if (codigo === "CEP_NAO_ENCONTRADO") return { mensagem: "CEP não encontrado. Confira os números digitados.", status: 404 };
  if (codigo === "COTACAO_SEM_OPCOES") return { mensagem: "Nenhuma transportadora atende esse endereço para os produtos escolhidos.", status: 422 };
  if (codigo === "COTACAO_INDISPONIVEL") return { mensagem: "A transportadora não conseguiu calcular o frete agora. Tente novamente.", status: 503 };
  return { mensagem: "Não foi possível consultar o CEP agora. Tente novamente.", status: 503 };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { cep?: string; subtotal?: number; itens?: Array<{ produto_id?: number; quantidade?: number }> };
    const itensRecebidos = Array.isArray(body.itens) ? body.itens : [];
    const ids = [...new Set(itensRecebidos.map((item) => Number(item.produto_id)).filter(Number.isInteger))];
    let produtosFrete: ProdutoFrete[] = [];
    let subtotal = Number(body.subtotal) || 0;
    if (ids.length) {
      const supabase = await criarClienteServidor();
      let { data: produtos, error } = await supabase.from("produtos")
        .select("id,nome,preco,ativo,peso_kg,altura_cm,largura_cm,comprimento_cm")
        .in("id", ids).eq("ativo", true);
      if (error) {
        const consultaLegada = await supabase.from("produtos").select("id,nome,preco,ativo").in("id", ids).eq("ativo", true);
        produtos = consultaLegada.data?.map((produto) => ({ ...produto, peso_kg: null, altura_cm: null, largura_cm: null, comprimento_cm: null })) ?? null;
        error = consultaLegada.error;
      }
      if (error || !produtos || produtos.length !== ids.length) return NextResponse.json({ erro: "Um produto não está disponível para calcular o frete." }, { status: 400 });
      produtosFrete = itensRecebidos.map((item) => {
        const produto = produtos.find((atual) => Number(atual.id) === Number(item.produto_id))!;
        return {
          ...produto, preco: Number(produto.preco), quantidade: Math.max(1, Math.floor(Number(item.quantidade) || 1)),
          peso_kg: produto.peso_kg === null ? null : Number(produto.peso_kg),
          altura_cm: produto.altura_cm === null ? null : Number(produto.altura_cm),
          largura_cm: produto.largura_cm === null ? null : Number(produto.largura_cm),
          comprimento_cm: produto.comprimento_cm === null ? null : Number(produto.comprimento_cm),
        };
      });
      subtotal = produtosFrete.reduce((soma, produto) => soma + produto.preco * produto.quantidade, 0);
    }
    const cotacao = await consultarFrete(String(body.cep || ""), subtotal, produtosFrete);
    return NextResponse.json(cotacao);
  } catch (erro) {
    const resposta = mensagemFrete(erro);
    return NextResponse.json({ erro: resposta.mensagem }, { status: resposta.status });
  }
}
