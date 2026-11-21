const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');

const filename = path.resolve(__dirname, '../lib/frete.ts');
const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleFrete = { exports: {} };
vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename })(require, moduleFrete, moduleFrete.exports);
const { calcularValorFrete } = moduleFrete.exports;

test('frete varia conforme o destino validado', () => {
  assert.equal(calcularValorFrete({ cep: '08180-050', cidade: 'São Paulo', estado: 'SP', regiao: 'Sudeste' }, 39.9).valor, 14.9);
  assert.equal(calcularValorFrete({ cep: '13010-000', cidade: 'Campinas', estado: 'SP', regiao: 'Sudeste' }, 39.9).valor, 19.9);
  assert.equal(calcularValorFrete({ cep: '30110-000', cidade: 'Belo Horizonte', estado: 'MG', regiao: 'Sudeste' }, 39.9).valor, 24.9);
  assert.equal(calcularValorFrete({ cep: '69005-000', cidade: 'Manaus', estado: 'AM', regiao: 'Norte' }, 39.9).valor, 39.9);
});

test('frete grátis respeita o valor mínimo da compra', () => {
  const cotacao = calcularValorFrete({ cep: '69005-000', cidade: 'Manaus', estado: 'AM', regiao: 'Norte' }, 210);
  assert.equal(cotacao.valor, 0);
  assert.equal(cotacao.gratis, true);
  assert.equal(cotacao.destino, 'Manaus/AM');
});

test('com transportadora configurada, não substitui cotação real por valor fixo quando faltam medidas', async () => {
  const tokenAnterior = process.env.MELHOR_ENVIO_TOKEN;
  process.env.MELHOR_ENVIO_TOKEN = 'token-apenas-para-teste';
  try {
    await comFetch([{status:200,body:{cep:'08180050',localidade:'São Paulo',uf:'SP'}}], async (chamadas) => {
      await assert.rejects(moduleFrete.exports.consultarFrete('08180050', 55.9, [{
        id: 1, nome: 'Produto sem medidas', preco: 55.9, quantidade: 1,
        peso_kg: null, altura_cm: null, largura_cm: null, comprimento_cm: null,
      }]), /MEDIDAS_FRETE_INCOMPLETAS/);
      assert.equal(chamadas.length, 1);
    });
  } finally {
    if (tokenAnterior === undefined) delete process.env.MELHOR_ENVIO_TOKEN;
    else process.env.MELHOR_ENVIO_TOKEN = tokenAnterior;
  }
});

test('reconhece MELHOR_ENVIO_KEY para uma cotação com medidas sem registrar o segredo', async () => {
  const anterior = process.env.MELHOR_ENVIO_KEY;
  const tokenAnterior = process.env.MELHOR_ENVIO_TOKEN;
  delete process.env.MELHOR_ENVIO_TOKEN;
  process.env.MELHOR_ENVIO_KEY = 'token-ficticio';
  const fetchAnterior = global.fetch;
  const chamadas = [];
  global.fetch = async (url, options = {}) => {
    chamadas.push({ url, authorization: options.headers?.Authorization });
    if (chamadas.length === 1) return { ok: true, json: async () => ({cep:'08180050',localidade:'São Paulo',uf:'SP'}) };
    return { ok: true, json: async () => ([{id:1,name:'PAC',price:'18.90',delivery_time:5,company:{name:'Correios'}}]) };
  };
  try {
    const cotacao = await moduleFrete.exports.consultarFrete('08180050', 55.9, [{
      id: 1, nome: 'Produto', preco: 55.9, quantidade: 1,
      peso_kg: 0.3, altura_cm: 12, largura_cm: 10, comprimento_cm: 15, medidas_confirmadas: true,
    }]);
    assert.equal(cotacao.valor, 18.9);
    assert.equal(cotacao.estimado, false);
    assert.equal(chamadas[1].authorization, 'Bearer token-ficticio');
  } finally {
    global.fetch = fetchAnterior;
    if (anterior === undefined) delete process.env.MELHOR_ENVIO_KEY;
    else process.env.MELHOR_ENVIO_KEY = anterior;
    if (tokenAnterior === undefined) delete process.env.MELHOR_ENVIO_TOKEN;
    else process.env.MELHOR_ENVIO_TOKEN = tokenAnterior;
  }
});

test('usa FRETE_BOTICA_ENVIO antes da chave antiga na cotação', async () => {
  const anterior = process.env.FRETE_BOTICA_ENVIO;
  const chaveAnterior = process.env.MELHOR_ENVIO_KEY;
  process.env.FRETE_BOTICA_ENVIO = 'token-novo-ficticio';
  process.env.MELHOR_ENVIO_KEY = 'token-antigo-ficticio';
  const fetchAnterior = global.fetch;
  const chamadas = [];
  global.fetch = async (url, options = {}) => {
    chamadas.push({ url, authorization: options.headers?.Authorization });
    return chamadas.length === 1
      ? { ok: true, json: async () => ({cep:'08180050',localidade:'São Paulo',uf:'SP'}) }
      : { ok: true, json: async () => ([{id:1,name:'PAC',price:'18.90',delivery_time:5,company:{name:'Correios'}}]) };
  };
  try {
    const cotacao = await moduleFrete.exports.consultarFrete('08180050', 55.9, [{
      id: 1, nome: 'Produto', preco: 55.9, quantidade: 1,
      peso_kg: 0.3, altura_cm: 12, largura_cm: 10, comprimento_cm: 15,
    }]);
    assert.equal(cotacao.valor, 18.9);
    assert.equal(chamadas[1].authorization, 'Bearer token-novo-ficticio');
  } finally {
    global.fetch = fetchAnterior;
    if (anterior === undefined) delete process.env.FRETE_BOTICA_ENVIO;
    else process.env.FRETE_BOTICA_ENVIO = anterior;
    if (chaveAnterior === undefined) delete process.env.MELHOR_ENVIO_KEY;
    else process.env.MELHOR_ENVIO_KEY = chaveAnterior;
  }
});

test('cotação da transportadora com embalagem provisória permanece identificada como estimativa', async () => {
  const anterior = process.env.MELHOR_ENVIO_KEY;
  const tokenAnterior = process.env.MELHOR_ENVIO_TOKEN;
  delete process.env.MELHOR_ENVIO_TOKEN;
  process.env.MELHOR_ENVIO_KEY = 'token-ficticio';
  const fetchAnterior = global.fetch;
  let chamadas = 0;
  global.fetch = async () => {
    chamadas++;
    return chamadas === 1
      ? {ok:true,json:async()=>({cep:'08180050',localidade:'São Paulo',uf:'SP'})}
      : {ok:true,json:async()=>[{id:1,name:'PAC',price:'18.90',delivery_time:5,company:{name:'Correios'}}]};
  };
  try {
    const cotacao = await moduleFrete.exports.consultarFrete('08180050', 55.9, [{
      id: 1, nome: 'Produto', preco: 55.9, quantidade: 1, peso_kg: 0.3,
      altura_cm: 12, largura_cm: 10, comprimento_cm: 15, medidas_confirmadas: false,
    }]);
    assert.equal(cotacao.valor, 18.9);
    assert.equal(cotacao.estimado, true);
  } finally {
    global.fetch = fetchAnterior;
    if (anterior === undefined) delete process.env.MELHOR_ENVIO_KEY;
    else process.env.MELHOR_ENVIO_KEY = anterior;
    if (tokenAnterior === undefined) delete process.env.MELHOR_ENVIO_TOKEN;
    else process.env.MELHOR_ENVIO_TOKEN = tokenAnterior;
  }
});

async function comFetch(respostas, executar) {
  const original = global.fetch;
  const chamadas = [];
  global.fetch = async (url) => {
    chamadas.push(url);
    const resposta = respostas.shift();
    if (resposta instanceof Error) throw resposta;
    return { ok: resposta.status === 200, status: resposta.status, json: async () => resposta.body };
  };
  try { await executar(chamadas); } finally { global.fetch = original; }
}

test('usa a BrasilAPI quando o ViaCEP falha e mantém a tarifa da região', async () => {
  await comFetch([new Error('timeout'), {status:200,body:{cep:'30110000',city:'Belo Horizonte',state:'MG'}}], async (chamadas) => {
    const cotacao = await moduleFrete.exports.consultarFrete('30110-000', 55.9);
    assert.equal(cotacao.destino, 'Belo Horizonte/MG');
    assert.equal(cotacao.valor, 24.9);
    assert.match(chamadas[1], /^https:\/\/brasilapi.com.br\/api\/cep\/v2\/30110000$/);
  });
});

test('não calcula para CEP inválido nem trata CEP inexistente como falha de rede', async () => {
  await comFetch([], async (chamadas) => {
    await assert.rejects(moduleFrete.exports.consultarFrete('123', 10), /CEP_INVALIDO/);
    assert.equal(chamadas.length, 0);
  });
  await comFetch([{status:200,body:{erro:true}}], async (chamadas) => {
    await assert.rejects(moduleFrete.exports.consultarFrete('00000000', 10), /CEP_NAO_ENCONTRADO/);
    assert.equal(chamadas.length, 1);
  });
});

test('informa indisponibilidade quando ambos os serviços falham', async () => {
  await comFetch([new Error('timeout'), {status:503}], async () => {
    await assert.rejects(moduleFrete.exports.consultarFrete('08180050', 10), /CEP_INDISPONIVEL/);
  });
});

test('resposta de contingência preserva o frete grátis a partir de R$ 210', async () => {
  await comFetch([{status:502}, {status:200,body:{cep:'69005000',city:'Manaus',state:'AM'}}], async () => {
    const cotacao = await moduleFrete.exports.consultarFrete('69005000', 210);
    assert.equal(cotacao.valor, 0);
    assert.equal(cotacao.gratis, true);
  });
});
