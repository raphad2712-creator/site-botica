const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(file, deps) {
  const module = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', js)(deps, module, module.exports);
  return module.exports;
}

function setup() {
  let saved, uploads = 0, removes = 0;
  const bucket = {
    upload: async () => { uploads++; return { error: null }; },
    remove: async () => { removes++; return { error: null }; },
    getPublicUrl: path => ({ data: { publicUrl: `https://botica.supabase.co/storage/v1/object/public/fotos-produtos/${path}` } }),
  };
  const admin = {
    storage: { getBucket: async () => ({ data: { id: 'fotos-produtos' } }), from: () => bucket },
    from: () => ({ insert: row => ({ select: () => ({ single: async () => { saved = row; return { data: { id: 77, ...row }, error: null }; } }) }) }),
  };
  const route = load('app/api/admin/produtos/route.ts', name => {
    if (name === 'node:crypto') return require(name);
    if (name === 'next/server') return { NextResponse: { json: (body, opts = {}) => ({ status: opts.status || 200, body }) } };
    if (name.includes('admin-access')) return { usuarioAdminAutorizado: async () => true };
    if (name.includes('security')) return { assinaturaArquivoValida: async file => new Uint8Array(await file.arrayBuffer())[0] === 0x89 };
    if (name.includes('supabase/server')) return { criarClienteServidor: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) } }) };
    if (name.includes('supabase/admin')) return { criarClienteAdmin: () => admin };
    throw Error(name);
  });
  return { route, get saved() { return saved; }, get uploads() { return uploads; }, get removes() { return removes; } };
}

function productForm(file) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ nome: 'Produto próprio', descricao: 'Descrição da loja', categoria: 'Beleza', preco: '55.90', estoque: '16', peso_kg: '', altura_cm: '', largura_cm: '', comprimento_cm: '' })) form.set(key, value);
  form.set('foto', file);
  return form;
}

test('administrador envia foto e publica produto com descrição e preço próprios', async () => {
  const api = setup();
  const photo = new File([Uint8Array.from([0x89, 0x50, 0x4e, 0x47])], 'foto.png', { type: 'image/png' });
  const response = await api.route.POST(new Request('https://botica.test/api/admin/produtos', { method: 'POST', body: productForm(photo) }));
  assert.equal(response.status, 201);
  assert.equal(api.uploads, 1);
  assert.equal(api.saved.descricao, 'Descrição da loja');
  assert.equal(api.saved.preco, 55.9);
  assert.equal(api.saved.estoque, 16);
  assert.equal(api.saved.ativo, true);
  assert.match(api.saved.imagem_url, /fotos-produtos\/.+\.png$/);
});

test('arquivo inválido não cria produto nem faz upload', async () => {
  const api = setup();
  const bad = new File(['fake'], 'foto.png', { type: 'image/png' });
  const response = await api.route.POST(new Request('https://botica.test/api/admin/produtos', { method: 'POST', body: productForm(bad) }));
  assert.equal(response.status, 400);
  assert.equal(api.uploads, 0);
  assert.equal(api.saved, undefined);
});
