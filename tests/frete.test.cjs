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
