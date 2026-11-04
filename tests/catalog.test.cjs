const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');

const loaded = new Map();
function load(relative) {
  const filename = path.resolve(__dirname, '..', relative);
  if (loaded.has(filename)) return loaded.get(filename);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (request) => request.startsWith('.')
    ? load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), `${request}.ts`)))
    : require(request);
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename })(localRequire, module, module.exports);
  loaded.set(filename, module.exports);
  return module.exports;
}
const { consultationProducts, matchConsultationProduct, consultationImage, consultationDarkImage, consultationArtwork, consultationDarkArtwork } = load('lib/consultation-products.ts');
const { buildCatalog, filterCatalog, isConsultation } = load('lib/catalog.ts');
const { imagemCatalogo } = load('lib/product-images.ts');
const registered = {
  id: 101, nome: 'Passiflora 300mg — 60 Cápsulas', descricao: 'Descrição cadastrada pela loja.',
  categoria: 'Sono', preco: 59.9, preco_antigo: 69.9, estoque: 8,
  imagem_url: '/foto-antiga.jpg', ativo: true,
};

test('quatorze produtos com imagens, preços e apresentações da loja', () => {
  assert.equal(consultationProducts.length, 14);
  assert.equal(new Set(consultationProducts.map(p => p.slug)).size, 14);
  for (const product of consultationProducts) {
    assert.ok(product.apresentacao.length > 0);
    assert.ok(product.precoDemonstrativo > 0);
    assert.ok(fs.existsSync(path.join(__dirname, '../public', consultationArtwork(product))));
    assert.ok(fs.existsSync(path.join(__dirname, '../public', consultationDarkArtwork(product))));
    assert.ok(fs.existsSync(path.join(__dirname, '../public', consultationImage(product))));
    assert.ok(fs.existsSync(path.join(__dirname, '../public', consultationDarkImage(product))));
    for (const key of ['preco', 'estoque', 'id']) assert.ok(!(key in product));
  }
});

test('cadastro real substitui a apresentação em consulta, sem duplicar e recebe o preço atualizado', () => {
  const catalog = buildCatalog([registered]);
  assert.equal(catalog.length, 14);
  assert.equal(catalog[0].id, registered.id);
  assert.equal(catalog[0].estoque, registered.estoque);
  assert.equal(catalog.filter(isConsultation).length, 13);
  assert.equal(filterCatalog(catalog, 'Todos', 'passiflora', 'relevancia')[0].preco, 55.9);
});

test('fórmula, concentração e apresentação diferentes mantêm a própria foto', () => {
  for (const name of ['Passiflora 500mg', 'Passiflora', 'Passiflora 300mg 120 cápsulas', 'Passiflora 300mg + Melatonina 3mg', 'Maca Peruana 5000mg']) {
    assert.equal(matchConsultationProduct(name), undefined, name);
    assert.equal(imagemCatalogo(name, '/foto-original.jpg'), '/foto-original.jpg', name);
  }
  assert.equal(imagemCatalogo('PASSIFLORA 300 mg / 60 cápsulas - Botica Bioenergética'), '/produtos/novos/passiflora-300mg.svg');
});

test('cadastro explicitamente inativo não volta como item em consulta', () => {
  const catalog = buildCatalog([{ ...registered, ativo: false }]);
  assert.equal(catalog.length, 13);
  assert.equal(filterCatalog(catalog, 'Todos', 'passiflora', 'relevancia').length, 0);
});

test('busca normaliza acentos e encontra os dados do rótulo', () => {
  const catalog = buildCatalog([]);
  assert.equal(filterCatalog(catalog, 'Todos', '60 CAPSULAS', 'relevancia').length, 9);
  assert.equal(filterCatalog(catalog, 'Naturais', '320 mg', 'relevancia')[0].nome, 'Saw Palmetto');
});

test('ordenação usa os preços exibidos, com os valores atualizados da loja', () => {
  const second = { ...registered, id: 102, nome: 'Outro produto', preco: 19.9 };
  const catalog = buildCatalog([registered, second]);
  const displayedPrice = p => isConsultation(p) ? p.precoDemonstrativo : p.preco;
  const expected = [29, 29.9, 39.9, 39.9, 49.9, 55.9, 59.9, 59.9, 79.9, 85.9, 89.9, 95, 99.9, 99.9];
  assert.deepEqual(filterCatalog(catalog, 'Todos', '', 'menor').map(displayedPrice), expected);
  assert.deepEqual(filterCatalog(catalog, 'Todos', '', 'maior').map(displayedPrice), [...expected].reverse());
});

test('creatina cadastrada aparece sem duplicação na categoria Academia', () => {
  const legacy = { ...registered, id: 103, nome: 'Creatina Monohidratada 300g', categoria: 'Academia' };
  const catalog = buildCatalog([registered, legacy]);
  assert.equal(catalog.length, 14);
  assert.equal(catalog.some(product => product.nome.includes('Creatina')), true);
  assert.equal(filterCatalog(catalog, 'Academia', '', 'relevancia').length, 2);
});

 test('preços e fórmulas correspondem à lista enviada pela loja', () => {
  const bySlug = Object.fromEntries(consultationProducts.map(p => [p.slug, p]));
  assert.equal(bySlug['creatina-300g'].precoDemonstrativo, 99.9);
  assert.equal(bySlug['vit-d-1000ui'].precoDemonstrativo, 29);
  assert.equal(bySlug['vit-b12-metilcobalamina'].nome, 'Vit B12');
  assert.equal(bySlug['vit-b12-metilcobalamina'].subtitulo, 'Metilcobalamina');
  assert.equal(bySlug['blend-magnesio-60caps'].composicao.length, 5);
  assert.equal(bySlug['testo-plus-30caps'].composicao.length, 9);
  assert.deepEqual(bySlug['testo-plus-30caps'].composicao.at(-1), { ingrediente: 'Turkesterone', quantidade: 'q.s.' });
});

test('atualização de preços preserva os itens marcados OK e outras fórmulas', () => {
  const { aplicarPrecoCatalogo } = load('lib/consultation-products.ts');
  const base = { nome: 'Passiflora 300 mg', preco: 39.9, preco_antigo: 49.9, estoque: 7, id: 12 };
  assert.deepEqual(aplicarPrecoCatalogo(base), { ...base, preco: 55.9, preco_antigo: null });
  for (const nome of ['Glucomanan 500 mg', 'Tribulus Terrestris 500 mg', 'Maca Peruana 500 mg', 'Passiflora 500 mg']) {
    const product = { ...base, nome };
    assert.equal(aplicarPrecoCatalogo(product), product);
  }
});
