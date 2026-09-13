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
const { consultationProducts, matchConsultationProduct, consultationImage, consultationArtwork } = load('lib/consultation-products.ts');
const { buildCatalog, filterCatalog, isConsultation } = load('lib/catalog.ts');
const { imagemCatalogo } = load('lib/product-images.ts');
const registered = {
  id: 101, nome: 'Passiflora 300mg — 60 Cápsulas', descricao: 'Descrição cadastrada pela loja.',
  categoria: 'Sono', preco: 59.9, preco_antigo: 69.9, estoque: 8,
  imagem_url: '/foto-antiga.jpg', ativo: true,
};

test('oito rótulos com fotos, artes e preços demonstrativos, sem estoque ou ID fictício', () => {
  assert.equal(consultationProducts.length, 8);
  assert.equal(new Set(consultationProducts.map(p => p.slug)).size, 8);
  for (const product of consultationProducts) {
    assert.equal(product.apresentacao, '60 cápsulas');
    assert.ok(product.precoDemonstrativo > 0);
    assert.ok(fs.existsSync(path.join(__dirname, '../public', consultationArtwork(product))));
    assert.ok(fs.existsSync(path.join(__dirname, '../public', consultationImage(product))));
    for (const key of ['preco', 'estoque', 'id']) assert.ok(!(key in product));
  }
});

test('cadastro real substitui a apresentação em consulta, sem duplicar ou alterar o preço', () => {
  const catalog = buildCatalog([registered]);
  assert.equal(catalog.length, 8);
  assert.equal(catalog[0], registered);
  assert.equal(catalog.filter(isConsultation).length, 7);
  assert.equal(filterCatalog(catalog, 'Naturais', 'passiflora', 'relevancia')[0].preco, 59.9);
  assert.equal(filterCatalog(catalog, 'Sono', '', 'relevancia')[0].id, 101);
});

test('fórmula, concentração e apresentação diferentes mantêm a própria foto', () => {
  for (const name of ['Passiflora 500mg', 'Passiflora', 'Passiflora 300mg 120 cápsulas', 'Passiflora 300mg + Melatonina 3mg', 'Maca Peruana 5000mg']) {
    assert.equal(matchConsultationProduct(name), undefined, name);
    assert.equal(imagemCatalogo(name, '/foto-original.jpg'), '/foto-original.jpg', name);
  }
  assert.equal(imagemCatalogo('PASSIFLORA 300 mg / 60 cápsulas - Botica Bioenergética'), '/produtos/linha-natural/passiflora-300mg.jpg');
});

test('cadastro explicitamente inativo não volta como item em consulta', () => {
  const catalog = buildCatalog([{ ...registered, ativo: false }]);
  assert.equal(catalog.length, 7);
  assert.equal(filterCatalog(catalog, 'Todos', 'passiflora', 'relevancia').length, 0);
});

test('busca normaliza acentos e encontra os dados do rótulo', () => {
  const catalog = buildCatalog([]);
  assert.equal(filterCatalog(catalog, 'Todos', '60 CAPSULAS', 'relevancia').length, 8);
  assert.equal(filterCatalog(catalog, 'Naturais', '320 mg', 'relevancia')[0].nome, 'Saw Palmetto');
});

test('ordenação usa os preços exibidos, preservando o preço do cadastro real', () => {
  const second = { ...registered, id: 102, nome: 'Outro produto', preco: 19.9 };
  const catalog = buildCatalog([registered, second]);
  const displayedPrice = p => isConsultation(p) ? p.precoDemonstrativo : p.preco;
  const expected = [19.9, 39.9, 49.9, 59.9, 59.9, 59.9, 69.9, 79.9, 129.9];
  assert.deepEqual(filterCatalog(catalog, 'Todos', '', 'menor').map(displayedPrice), expected);
  assert.deepEqual(filterCatalog(catalog, 'Todos', '', 'maior').map(displayedPrice), [...expected].reverse());
});
