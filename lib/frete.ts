export type EnderecoFrete = {
  cep: string;
  cidade: string;
  estado: string;
  regiao: string;
};

export type CotacaoFrete = {
  valor: number;
  prazoMinimo: number;
  prazoMaximo: number;
  destino: string;
  gratis: boolean;
};

type ViaCepResposta = {
  cep?: string;
  localidade?: string;
  uf?: string;
  regiao?: string;
  erro?: boolean | string;
};

export const LIMITE_FRETE_GRATIS = 210;

export function somenteNumerosCep(valor: string) {
  return valor.replace(/\D/g, "").slice(0, 8);
}

export function formatarCep(valor: string) {
  const numeros = somenteNumerosCep(valor);
  return numeros.length > 5 ? `${numeros.slice(0, 5)}-${numeros.slice(5)}` : numeros;
}

export function calcularValorFrete(endereco: EnderecoFrete, subtotal: number): CotacaoFrete {
  const cepNumerico = somenteNumerosCep(endereco.cep);
  const capitalSp = endereco.estado === "SP" && (cepNumerico < "06000000" || (cepNumerico >= "08000000" && cepNumerico < "08500000"));
  const tabela = capitalSp
    ? { valor: 14.9, prazoMinimo: 1, prazoMaximo: 3 }
    : endereco.estado === "SP"
      ? { valor: 19.9, prazoMinimo: 2, prazoMaximo: 5 }
      : endereco.regiao === "Sudeste" || endereco.regiao === "Sul"
        ? { valor: 24.9, prazoMinimo: 3, prazoMaximo: 7 }
        : endereco.regiao === "Centro-Oeste"
          ? { valor: 29.9, prazoMinimo: 4, prazoMaximo: 8 }
          : endereco.regiao === "Nordeste"
            ? { valor: 34.9, prazoMinimo: 5, prazoMaximo: 10 }
            : { valor: 39.9, prazoMinimo: 7, prazoMaximo: 12 };
  const gratis = subtotal >= LIMITE_FRETE_GRATIS;
  return {
    ...tabela,
    valor: gratis ? 0 : tabela.valor,
    destino: `${endereco.cidade}/${endereco.estado}`,
    gratis,
  };
}

export async function consultarFrete(cepInformado: string, subtotal: number): Promise<CotacaoFrete> {
  const cep = somenteNumerosCep(cepInformado);
  if (cep.length !== 8) throw new Error("CEP_INVALIDO");
  const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(8000),
  });
  if (!resposta.ok) throw new Error("CEP_INDISPONIVEL");
  const dados = (await resposta.json()) as ViaCepResposta;
  if (dados.erro || !dados.cep || !dados.localidade || !dados.uf) throw new Error("CEP_NAO_ENCONTRADO");
  return calcularValorFrete({ cep: dados.cep, cidade: dados.localidade, estado: dados.uf, regiao: dados.regiao || "" }, Math.max(0, Number(subtotal) || 0));
}
