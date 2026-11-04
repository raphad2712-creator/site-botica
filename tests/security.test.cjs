const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, dependencies = require) {
  const module = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('require', 'module', 'exports', js)(dependencies, module, module.exports);
  return module.exports;
}
const { destinoLocal } = load('lib/safe-redirect.ts');
const validation = load('lib/checkout-validation.ts');
const { validarItens, validarCliente } = validation;
const { lerProdutosSalvos } = load('lib/stored-products.ts');

test('login rejects external URLs, backslash URLs and control-character redirects', () => {
  for (const input of ['https://evil.test', '//evil.test', '/\\evil.test', '/\t/evil.test', '/\n/evil.test', 'javascript:alert(1)', null, '']) {
    assert.equal(destinoLocal(input), '/minha-conta', String(input));
  }
  for (const input of ['/checkout', '/#receita', '/minha-conta?pedido=12#pedidos']) assert.equal(destinoLocal(input), input);
});

test('order quantities are aggregated before stock checks; invalid lines are rejected', () => {
  assert.deepEqual(validarItens([{ produto_id: 4, quantidade: 3 }, { produto_id: 4, quantidade: 4 }]), [{ produto_id: 4, quantidade: 7 }]);
  for (const input of [null, {}, [], [null], [{ produto_id: 1, quantidade: 0 }], [{ produto_id: 1, quantidade: 1.5 }], [{ produto_id: '1', quantidade: 1 }], [{ produto_id: 1, quantidade: -1 }], [{ produto_id: 1, quantidade: 101 }], [{ produto_id: 1, quantidade: 60 }, { produto_id: 1, quantidade: 60 }], Array(101).fill({ produto_id: 1, quantidade: 1 })]) assert.throws(() => validarItens(input));
});

const address = { nome: 'Ana Silva', email: 'ana@example.test', cpf: '12345678901', cep: '08180-050', rua: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP' };
test('buyer fields have type and length limits and require a complete Brazilian address', () => {
  assert.equal(validarCliente(address).cidade, 'São Paulo');
  for (const value of [null, [], { ...address, rua: {} }, { ...address, numero: '' }, { ...address, estado: 'ZZ' }, { ...address, cep: '123' }, { ...address, complemento: 'x'.repeat(121) }]) assert.throws(() => validarCliente(value));
});

test('corrupt browser storage does not crash the storefront or inflate totals', () => {
  const product = { id: 1, nome: 'Produto', categoria: 'Naturais', preco: 12, estoque: 10, quantidade: 2 };
  for (const value of ['{', '{}', 'null', '42', JSON.stringify([null, {}, { ...product, quantidade: -1 }])]) assert.deepEqual(lerProdutosSalvos(value, true), []);
  assert.deepEqual(lerProdutosSalvos(JSON.stringify([product, product]), true), [product]);
  assert.equal(lerProdutosSalvos(JSON.stringify([{ ...product, quantidade: 100000 }]), true).length, 0);
  assert.equal(lerProdutosSalvos(JSON.stringify([product])).length, 1);
});

test('checkout rejects duplicate stock bypass and malformed JSON without writing an order', async () => {
  let writes = 0;
  let queriedIds;
  const database = {
    auth: { getUser: async () => ({ data: { user: { id: 'user-1', email: 'ana@example.test' } } }) },
    from: () => ({
      select: () => ({ in: (_, ids) => { queriedIds = ids; return { eq: async () => ({ data: [{ id: 4, nome: 'Produto', preco: 10, estoque: 5, ativo: true }] }) }; } }),
      insert: () => { writes++; throw new Error('unexpected write'); },
    }),
  };
  const route = load('app/api/pedidos/route.ts', name => {
    if (name === 'next/server') return { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } };
    if (name.includes('supabase/server')) return { criarClienteServidor: async () => database };
    if (name.includes('supabase/admin')) return { criarClienteAdmin: () => database };
    if (name.includes('security')) return { limiteExcedido: async () => false, emailValido: value => value };
    if (name.includes('consultation-products')) return load('lib/consultation-products.ts');
    if (name.includes('checkout-validation')) return validation;
    return {};
  });
  const previous = process.env.PAGBANK_TOKEN;
  process.env.PAGBANK_TOKEN = 'test-only';
  const error = console.error; console.error = () => {};
  try {
    const response = await route.POST(new Request('https://botica.test/api/pedidos', { method: 'POST', body: JSON.stringify({ cliente: address, metodo_pagamento: 'pix', itens: [{ produto_id: 4, quantidade: 3 }, { produto_id: 4, quantidade: 3 }] }) }));
    assert.equal(response.status, 400);
    assert.match(response.body.erro, /Estoque insuficiente/);
    assert.deepEqual(queriedIds, [4]);
    assert.equal(writes, 0);
    const malformed = await route.POST(new Request('https://botica.test/api/pedidos', { method: 'POST', body: '{' }));
    assert.equal(malformed.status, 400);
    assert.equal(writes, 0);
  } finally {
    console.error = error;
    if (previous === undefined) delete process.env.PAGBANK_TOKEN; else process.env.PAGBANK_TOKEN = previous;
  }
});
