const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
function moduleFrom(file, requireFn) {
  const out = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  new Function('require','module','exports',code)(requireFn,out,out.exports);
  return out.exports;
}
const labels = moduleFrom('lib/consultation-products.ts', require);
function setup(rows = []) {
  let writes = 0;
  const admin = { from() { return {
    select() { return {
      ilike: async () => ({ data:rows }),
      eq: (_,id) => ({single:async () => ({data:rows.find(p=>p.id===id)})}),
    }; },
    async upsert(product) { writes++; if(!rows.some(p=>p.id===product.id)) rows.push(product); return {}; },
  }; } };
  const route = moduleFrom('app/api/catalogo/[slug]/route.ts', name => name==='next/server' ? {NextResponse:{json:(body,options={})=>({body,status:options.status||200})}} : name.includes('supabase') ? {criarClienteAdmin:()=>admin} : labels);
  return {call:slug=>route.POST({}, {params:Promise.resolve({slug})}),rows,get writes(){return writes;}};
}
test('os oito produtos recebem cadastros estáveis e não duplicam ao adicionar novamente',async()=>{
 const api=setup();
 for(const p of labels.consultationProducts){ const first=await api.call(p.slug); const again=await api.call(p.slug); assert.equal(first.status,200); assert.equal(first.body.id,again.body.id); assert.equal(first.body.preco,p.precoDemonstrativo); assert.equal(first.body.imagem_url,labels.consultationImage(p)); }
 assert.equal(api.rows.length,8); assert.equal(api.writes,8);
});
test('cadastro existente mantém ID, valor, estoque e indisponibilidade',async()=>{
 const row={id:45,nome:'Passiflora 300 mg',preco:65,estoque:4,ativo:true}; const api=setup([row]);
 assert.deepEqual((await api.call('passiflora-300mg')).body,row); assert.equal(api.writes,0);
 row.ativo=false; assert.equal((await api.call('passiflora-300mg')).status,409); assert.equal(api.writes,0);
});
test('slug desconhecido não grava produtos',async()=>{const api=setup();assert.equal((await api.call('outro')).status,404);assert.equal(api.writes,0);});
