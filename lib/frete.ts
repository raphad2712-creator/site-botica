export type EnderecoFrete = { cep: string; cidade: string; estado: string; regiao: string };

export type ProdutoFrete = {
  id: number | string;
  nome: string;
  preco: number;
  quantidade: number;
  peso_kg: number | null;
  altura_cm: number | null;
  largura_cm: number | null;
  comprimento_cm: number | null;
};

export type CotacaoFrete = {
  valor: number;
  prazoMinimo: number;
  prazoMaximo: number;
  destino: string;
  gratis: boolean;
  transportadora: string;
  servico: string;
  servicoId: number | null;
  estimado: boolean;
};

type ViaCepResposta = { cep?: string; localidade?: string; uf?: string; regiao?: string; erro?: boolean | string };
type MelhorEnvioResposta = {
  id?: number; name?: string; price?: string; custom_price?: string;
  delivery_time?: number; custom_delivery_time?: number;
  delivery_range?: { min?: number; max?: number };
  custom_delivery_range?: { min?: number; max?: number };
  company?: { name?: string }; error?: string;
};

export const LIMITE_FRETE_GRATIS = 210;
export const CEP_ORIGEM_PADRAO = "08180050";

export function somenteNumerosCep(valor: string) { return valor.replace(/\D/g, "").slice(0, 8); }

export function formatarCep(valor: string) {
  const numeros = somenteNumerosCep(valor);
  return numeros.length > 5 ? `${numeros.slice(0, 5)}-${numeros.slice(5)}` : numeros;
}

export function calcularValorFrete(endereco: EnderecoFrete, subtotal: number): CotacaoFrete {
  const cepNumerico = somenteNumerosCep(endereco.cep);
  const capitalSp = endereco.estado === "SP" && (cepNumerico < "06000000" || (cepNumerico >= "08000000" && cepNumerico < "08500000"));
  const tabela = capitalSp
    ? { valor: 14.9, prazoMinimo: 1, prazoMaximo: 3 }
    : endereco.estado === "SP" ? { valor: 19.9, prazoMinimo: 2, prazoMaximo: 5 }
      : endereco.regiao === "Sudeste" || endereco.regiao === "Sul" ? { valor: 24.9, prazoMinimo: 3, prazoMaximo: 7 }
        : endereco.regiao === "Centro-Oeste" ? { valor: 29.9, prazoMinimo: 4, prazoMaximo: 8 }
          : endereco.regiao === "Nordeste" ? { valor: 34.9, prazoMinimo: 5, prazoMaximo: 10 }
            : { valor: 39.9, prazoMinimo: 7, prazoMaximo: 12 };
  const gratis = subtotal >= LIMITE_FRETE_GRATIS;
  return {
    ...tabela, valor: gratis ? 0 : tabela.valor,
    destino: `${endereco.cidade}/${endereco.estado}`, gratis,
    transportadora: "Tabela da loja", servico: "Entrega padrão", servicoId: null, estimado: true,
  };
}

async function consultarEndereco(cepInformado: string): Promise<EnderecoFrete> {
  const cep = somenteNumerosCep(cepInformado);
  if (cep.length !== 8) throw new Error("CEP_INVALIDO");
  const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    headers: { Accept: "application/json" }, next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000),
  });
  if (!resposta.ok) throw new Error("CEP_INDISPONIVEL");
  const dados = (await resposta.json()) as ViaCepResposta;
  if (dados.erro || !dados.cep || !dados.localidade || !dados.uf) throw new Error("CEP_NAO_ENCONTRADO");
  return { cep: dados.cep, cidade: dados.localidade, estado: dados.uf, regiao: dados.regiao || "" };
}

function possuiMedidas(produto: ProdutoFrete) {
  return [produto.peso_kg, produto.altura_cm, produto.largura_cm, produto.comprimento_cm]
    .every((valor) => Number.isFinite(Number(valor)) && Number(valor) > 0);
}

async function consultarMelhorEnvio(endereco: EnderecoFrete, subtotal: number, produtos: ProdutoFrete[]) {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token || !produtos.length || !produtos.every(possuiMedidas)) return null;
  const baseUrl = process.env.MELHOR_ENVIO_SANDBOX === "true"
    ? "https://sandbox.melhorenvio.com.br" : "https://www.melhorenvio.com.br";
  const resposta = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json",
      "User-Agent": process.env.MELHOR_ENVIO_USER_AGENT || "Botica Bioenergetica (raphad2712@gmail.com)",
    },
    body: JSON.stringify({
      from: { postal_code: somenteNumerosCep(process.env.CEP_ORIGEM_FRETE || CEP_ORIGEM_PADRAO) },
      to: { postal_code: somenteNumerosCep(endereco.cep) },
      products: produtos.map((produto) => ({
        id: String(produto.id), width: Number(produto.largura_cm), height: Number(produto.altura_cm),
        length: Number(produto.comprimento_cm), weight: Number(produto.peso_kg),
        insurance_value: Number(produto.preco.toFixed(2)), quantity: produto.quantidade,
      })),
      options: { receipt: false, own_hand: false },
    }),
    signal: AbortSignal.timeout(15000), cache: "no-store",
  });
  if (!resposta.ok) {
    console.error("ERRO_MELHOR_ENVIO", { status: resposta.status, resposta: (await resposta.text()).slice(0, 500) });
    throw new Error("COTACAO_INDISPONIVEL");
  }
  const dados = (await resposta.json()) as MelhorEnvioResposta[];
  const opcoes = dados.filter((opcao) => !opcao.error && Number(opcao.custom_price ?? opcao.price) > 0).map((opcao) => {
    const faixa = opcao.custom_delivery_range ?? opcao.delivery_range;
    const prazo = Number(opcao.custom_delivery_time ?? opcao.delivery_time ?? 0);
    return {
      id: Number(opcao.id), nome: opcao.name || "Entrega", transportadora: opcao.company?.name || "Transportadora",
      valor: Number(opcao.custom_price ?? opcao.price), prazoMinimo: Number(faixa?.min ?? prazo), prazoMaximo: Number(faixa?.max ?? prazo),
    };
  }).sort((a, b) => a.valor - b.valor);
  if (!opcoes.length) throw new Error("COTACAO_SEM_OPCOES");
  const melhor = opcoes[0];
  const gratis = subtotal >= LIMITE_FRETE_GRATIS;
  return {
    valor: gratis ? 0 : Number(melhor.valor.toFixed(2)), prazoMinimo: melhor.prazoMinimo, prazoMaximo: melhor.prazoMaximo,
    destino: `${endereco.cidade}/${endereco.estado}`, gratis, transportadora: melhor.transportadora,
    servico: melhor.nome, servicoId: melhor.id, estimado: false,
  } satisfies CotacaoFrete;
}

export async function consultarFrete(cepInformado: string, subtotal: number, produtos: ProdutoFrete[] = []): Promise<CotacaoFrete> {
  const endereco = await consultarEndereco(cepInformado);
  const subtotalSeguro = Math.max(0, Number(subtotal) || 0);
  const cotacaoReal = await consultarMelhorEnvio(endereco, subtotalSeguro, produtos);
  return cotacaoReal ?? calcularValorFrete(endereco, subtotalSeguro);
}
