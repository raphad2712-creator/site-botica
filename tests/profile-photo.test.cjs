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
const photoPaths = load('lib/profile-photo.ts');
const base = 'https://botica-test.supabase.co';
const oldPath = 'user-1/perfil.png';
const oldPhoto = `${base}/storage/v1/object/public/fotos-perfil/${oldPath}?v=1`;

test('profile cleanup accepts only the authenticated user’s own image paths', () => {
  assert.equal(photoPaths.caminhoFotoPerfil(oldPhoto, base, 'user-1'), oldPath);
  for (const url of [`${base}/storage/v1/object/public/fotos-perfil/other-user/perfil.png`, 'https://evil.test/photo.png', `${base}/storage/v1/object/public/fotos-perfil/user-1/../other-user/perfil.png`, `${base}/storage/v1/object/public/fotos-perfil/user-1/%2fother-user.png`, null]) assert.equal(photoPaths.caminhoFotoPerfil(url, base, 'user-1'), null);
});

function setup({ signedIn = true, uploadError = false, metadataError = false, signature = true, storedPhoto = oldPhoto } = {}) {
  const calls = [];
  const bucket = {
    upload: async (path, file, options) => { calls.push(['upload', path, options]); return { error: uploadError ? new Error('upload failed') : null }; },
    remove: async paths => { calls.push(['remove', paths]); return { error: null }; },
    getPublicUrl: path => ({ data: { publicUrl: `${base}/storage/v1/object/public/fotos-perfil/${path}` } }),
  };
  const admin = { storage: { getBucket: async () => ({ data: {} }), from: () => bucket } };
  const user = { id: 'user-1', user_metadata: { foto_url: storedPhoto, nome: 'Ana' } };
  const client = { auth: {
    getUser: async () => ({ data: { user: signedIn ? user : null } }),
    updateUser: async update => { calls.push(['metadata', update]); return { error: metadataError ? new Error('auth failed') : null }; },
  } };
  const route = load('app/api/perfil/foto/route.ts', name => {
    if (name === 'next/server') return { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } };
    if (name.includes('supabase/admin')) return { criarClienteAdmin: () => admin };
    if (name.includes('supabase/server')) return { criarClienteServidor: async () => client };
    if (name.includes('profile-photo')) return photoPaths;
    if (name.includes('security')) return { limiteExcedido: async () => false, assinaturaArquivoValida: async () => signature };
    return require(name);
  });
  return { route, calls };
}
function request(file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'foto.png', { type: 'image/png' })) {
  const form = new FormData(); form.append('foto', file);
  return new Request('https://botica.test/api/perfil/foto', { method: 'POST', body: form });
}

test('new photo is persisted before cleaning up the previous photo', async () => {
  const previous = process.env.NEXT_PUBLIC_SUPABASE_URL; process.env.NEXT_PUBLIC_SUPABASE_URL = base;
  try {
    const { route, calls } = setup();
    const result = await route.POST(request());
    assert.equal(result.status, 200);
    assert.match(result.body.foto_url, /user-1\/[a-f0-9-]+\.png$/);
    assert.deepEqual(calls.map(call => call[0]), ['upload', 'metadata', 'remove']);
    assert.equal(calls[0][2].upsert, false);
    assert.deepEqual(calls[2][1], [oldPath]);
    assert.deepEqual(calls[1][1], { data: { foto_url: result.body.foto_url } });
  } finally { if (previous === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = previous; }
});

test('failed upload never removes the previous photo', async () => {
  const { route, calls } = setup({ uploadError: true });
  assert.equal((await route.POST(request())).status, 500);
  assert.deepEqual(calls.map(call => call[0]), ['upload']);
});

test('failed profile update rolls back only the newly uploaded image', async () => {
  const { route, calls } = setup({ metadataError: true });
  assert.equal((await route.POST(request())).status, 500);
  assert.deepEqual(calls.map(call => call[0]), ['upload', 'metadata', 'remove']);
  assert.deepEqual(calls[2][1], [calls[0][1]]);
  assert.notEqual(calls[0][1], oldPath);
});

test('upload rejects guests, unsupported formats and invalid image signatures', async () => {
  const guest = setup({ signedIn: false });
  assert.equal((await guest.route.POST(request())).status, 401);
  assert.equal(guest.calls.length, 0);
  const svg = setup();
  assert.equal((await svg.route.POST(request(new File(['<svg/>'], 'foto.svg', { type: 'image/svg+xml' })))).status, 400);
  assert.equal(svg.calls.length, 0);
  const invalid = setup({ signature: false });
  assert.equal((await invalid.route.POST(request())).status, 400);
  assert.equal(invalid.calls.length, 0);
});

test('removing a photo explicitly clears merged auth metadata', async () => {
  const { route, calls } = setup({ storedPhoto: null });
  assert.equal((await route.DELETE()).status, 200);
  assert.deepEqual(calls, [['metadata', { data: { foto_url: null } }]]);
});
