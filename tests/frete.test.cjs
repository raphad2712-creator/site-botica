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
