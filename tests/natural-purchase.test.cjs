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
    insert(product) { writes++; const saved={...product,id:900000+writes}; rows.push(saved); return {select(){return {single:async()=>({data:saved})};}}; },
  }; } };
  const route = moduleFrom('app/api/catalogo/[slug]/route.ts', name => name==='next/server'
    ? {NextResponse:{json:(body,options={})=>({body,status:options.status||200})}}
    : name.includes('supabase')
      ? {criarClienteServidor:async()=>admin}
      : name.includes('security')
        ? {limiteExcedido:async()=>false,respostaMuitasTentativas:()=>({status:429})}
        : labels);
  return {call:slug=>route.POST({}, {params:Promise.resolve({slug})}),rows,get writes(){return writes;}};
}
test('produto sem cadastro não inventa estoque nem grava produtos',async()=>{
 const api=setup();
 for(const p of labels.consultationProducts) assert.equal((await api.call(p.slug)).status,409);
 assert.equal(api.rows.length,0); assert.equal(api.writes,0);
});
test('cadastro existente preserva o preço da loja, ID, estoque e indisponibilidade',async()=>{
 const row={id:45,nome:'Passiflora 300 mg',preco:65,estoque:4,estoque_confirmado:true,ativo:true}; const api=setup([row]);
 assert.deepEqual((await api.call('passiflora-300mg')).body,row); assert.equal(api.writes,0);
 row.estoque_confirmado=false; assert.equal((await api.call('passiflora-300mg')).status,409); row.estoque_confirmado=true;
 row.ativo=false; assert.equal((await api.call('passiflora-300mg')).status,409); assert.equal(api.writes,0);
});
test('slug desconhecido não grava produtos',async()=>{const api=setup();assert.equal((await api.call('outro')).status,404);assert.equal(api.writes,0);});
