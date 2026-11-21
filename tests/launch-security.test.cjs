const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const ts=require('typescript');
function load(file,deps){const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(deps,module,module.exports);return module.exports;}
const response={NextResponse:{json:(body,options={})=>({body,status:options.status||200})}};
test('liberação de compra falha fechada sem banco corrigido, token, produção e frete conferido',async()=>{
 const keys=['PAGBANK_TOKEN','PAGAMENTO_TOKEN','SUPABASE_SERVICE_ROLE_KEY','PAGBANK_SANDBOX','MODO_PEDIDO_TESTE','MELHOR_ENVIO_TOKEN','FRETE_TABELA_APROVADA'];const prior=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 let data=true;const mod=load('lib/launch-readiness.ts',()=>({criarClienteAdmin:()=>({rpc:async()=>({data})})}));
 try{
 Object.assign(process.env,{PAGBANK_TOKEN:'test-only',SUPABASE_SERVICE_ROLE_KEY:'test-only',PAGBANK_SANDBOX:'false',MODO_PEDIDO_TESTE:'false',FRETE_TABELA_APROVADA:'true'});delete process.env.MELHOR_ENVIO_TOKEN;
 assert.equal(await mod.comprasLiberadas(),true);
 delete process.env.PAGBANK_TOKEN;process.env.PAGAMENTO_TOKEN='test-only';assert.equal(await mod.comprasLiberadas(),true);delete process.env.PAGAMENTO_TOKEN;process.env.PAGBANK_TOKEN='test-only';
 for(const [key,value]of [['PAGBANK_TOKEN',''],['SUPABASE_SERVICE_ROLE_KEY',''],['PAGBANK_SANDBOX','true'],['MODO_PEDIDO_TESTE','true'],['FRETE_TABELA_APROVADA','false']]){const old=process.env[key];process.env[key]=value;assert.equal(await mod.comprasLiberadas(),false,key);process.env[key]=old;}
 data=false;assert.equal(await mod.comprasLiberadas(),false);data=null;assert.equal(await mod.comprasLiberadas(),false);
 }finally{for(const k of keys)if(prior[k]===undefined)delete process.env[k];else process.env[k]=prior[k];}
});
test('papel admin editado no perfil não basta para liberar acesso ao servidor',async()=>{
 const old=process.env.ADMIN_EMAIL;process.env.ADMIN_EMAIL='owner@example.test';let safe=true;
 const mod=load('lib/admin-access.ts',()=>({segurancaBancoPronta:async()=>safe}));
 const supabase={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{funcao:'admin'}})})})})};
 const owner={id:'owner',email:'owner@example.test',email_confirmed_at:'2026-01-01'};
 try{assert.equal(await mod.usuarioAdminAutorizado(owner,supabase),true);assert.equal(await mod.usuarioAdminAutorizado({...owner,email:'client@example.test'},supabase),false);assert.equal(await mod.usuarioAdminAutorizado({...owner,email_confirmed_at:undefined},supabase),false);safe=false;assert.equal(await mod.usuarioAdminAutorizado(owner,supabase),false);}finally{if(old===undefined)delete process.env.ADMIN_EMAIL;else process.env.ADMIN_EMAIL=old;}
});
test('nenhum pedido é gravado quando a checagem de lançamento falha, mesmo com flag de teste',async()=>{
 let writes=0;const old=process.env.MODO_PEDIDO_TESTE;process.env.MODO_PEDIDO_TESTE='true';
 const route=load('app/api/pedidos/route.ts',name=>{
 if(name==='next/server')return response;
 if(name.includes('launch-readiness'))return{comprasLiberadas:async()=>false};
 if(name.includes('security'))return{limiteExcedido:async()=>false};
 if(name.includes('supabase/server'))return{criarClienteServidor:async()=>({auth:{getUser:async()=>({data:{user:{id:'owner',email:'owner@example.test'}}})},from:()=>{writes++;throw Error('write');}})};
 return {};
 });
 try{assert.equal((await route.POST(new Request('https://botica.test/api/pedidos',{method:'POST',body:'{}'}))).status,503);assert.equal(writes,0);}finally{if(old===undefined)delete process.env.MODO_PEDIDO_TESTE;else process.env.MODO_PEDIDO_TESTE=old;}
});
test('falha de rede do e-mail não desfaz pedido ou receita que já foi salvo',async()=>{
 const prev={key:process.env.BREVO_API_KEY,sender:process.env.EMAIL_REMETENTE,fetch:global.fetch};
 process.env.BREVO_API_KEY='test-only';process.env.EMAIL_REMETENTE='sender@example.test';global.fetch=async()=>{throw Error('timeout')};
 try{const mod=load('lib/email.ts',require);assert.deepEqual(await mod.enviarEmail({para:'client@example.test',assunto:'Teste',html:'Teste'}),{enviado:false,motivo:'BREVO_INDISPONIVEL'});}finally{global.fetch=prev.fetch;if(prev.key===undefined)delete process.env.BREVO_API_KEY;else process.env.BREVO_API_KEY=prev.key;if(prev.sender===undefined)delete process.env.EMAIL_REMETENTE;else process.env.EMAIL_REMETENTE=prev.sender;}
});
test('webhook rejeita assinatura inválida antes de acessar o banco',async()=>{
 const old=process.env.PAGBANK_TOKEN;process.env.PAGBANK_TOKEN='test-only';let calls=0;
 const route=load('app/api/pagbank/webhook/route.ts',name=>name==='next/server'?response:name==='node:crypto'?require(name):{criarClienteAdmin:()=>{calls++;throw Error('not allowed')}});
 try{const r=await route.POST(new Request('https://botica.test/api/pagbank/webhook',{method:'POST',body:'{}',headers:{'x-authenticity-token':'bad'}}));assert.equal(r.status,401);assert.equal(calls,0);}finally{if(old===undefined)delete process.env.PAGBANK_TOKEN;else process.env.PAGBANK_TOKEN=old;}
});
test('webhook aceita assinatura ECDSA do corpo original e rejeita conteúdo alterado',async()=>{
 const crypto=require('node:crypto');const pair=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 const prev={token:process.env.PAGBANK_TOKEN,key:process.env.PAGBANK_WEBHOOK_PUBLIC_KEY};
 process.env.PAGBANK_TOKEN='test-only';
 process.env.PAGBANK_WEBHOOK_PUBLIC_KEY=pair.publicKey.export({format:'der',type:'spki'}).toString('base64');
 let calls=0;
 const route=load('app/api/pagbank/webhook/route.ts',name=>name==='next/server'?response:name==='node:crypto'?require(name):name.includes('launch-readiness')?{segurancaBancoPronta:async()=>{calls++;return false}}:{criarClienteAdmin:()=>{throw Error('not allowed')}});
 const raw='{"reference_id":"1", "charges":[]}';
 const signature=crypto.sign('sha256',Buffer.from(raw),pair.privateKey).toString('base64');
 try{
  const accepted=await route.POST(new Request('https://botica.test/api/pagbank/webhook',{method:'POST',body:raw,headers:{'x-payload-signature':`invalid, ${signature}`}}));
  assert.equal(accepted.status,503);assert.equal(calls,1);
  const rejected=await route.POST(new Request('https://botica.test/api/pagbank/webhook',{method:'POST',body:raw+' ',headers:{'x-payload-signature':signature,'x-authenticity-token':crypto.createHash('sha256').update('test-only-'+raw+' ').digest('hex')}}));
  assert.equal(rejected.status,401);assert.equal(calls,1);
 }finally{for(const [key,value] of Object.entries(prev)){const env=key==='token'?'PAGBANK_TOKEN':'PAGBANK_WEBHOOK_PUBLIC_KEY';if(value===undefined)delete process.env[env];else process.env[env]=value;}}
});
test('tentativa recusada não cancela pedido que ainda pode ser pago no checkout',async()=>{
 const old=process.env.PAGBANK_TOKEN;process.env.PAGBANK_TOKEN='test-only';let writes=0;
 const payload=JSON.stringify({reference_id:'17',charges:[{id:'DECLINED-1',status:'DECLINED'}]});
 const signature=require('node:crypto').createHash('sha256').update('test-only-'+payload).digest('hex');
 const route=load('app/api/pagbank/webhook/route.ts',name=>name==='next/server'?response:name==='node:crypto'?require(name):name.includes('launch-readiness')?{segurancaBancoPronta:async()=>true}:{criarClienteAdmin:()=>{writes++;throw Error('unexpected write')}});
 try{const r=await route.POST(new Request('https://botica.test/api/pagbank/webhook',{method:'POST',body:payload,headers:{'x-authenticity-token':signature}}));assert.equal(r.status,200);assert.equal(writes,0);}finally{if(old===undefined)delete process.env.PAGBANK_TOKEN;else process.env.PAGBANK_TOKEN=old;}
});
test('limitador ignora cabeçalho Cloudflare controlado pelo visitante e falha fechado em produção',async()=>{
 const old={secret:process.env.RATE_LIMIT_SECRET,env:process.env.NODE_ENV};process.env.RATE_LIMIT_SECRET='isolated-test-only';process.env.NODE_ENV='production';let ok=true;const keys=[];
 const mod=load('lib/security.ts',name=>name==='next/server'?response:name==='node:crypto'?require(name):{criarClienteAdmin:()=>({rpc:async(_,args)=>{keys.push(args.p_chave);if(!ok)throw Error('offline');return{data:true}}})});
 try{for(const cf of ['1.1.1.1','8.8.8.8'])assert.equal(await mod.limiteExcedido(new Request('https://botica.test',{headers:{'x-forwarded-for':'203.0.113.8','cf-connecting-ip':cf}}),'auth',8,600),false);assert.equal(keys[0],keys[1]);ok=false;assert.equal(await mod.limiteExcedido(new Request('https://botica.test'),'auth',8,600),true);}finally{if(old.secret===undefined)delete process.env.RATE_LIMIT_SECRET;else process.env.RATE_LIMIT_SECRET=old.secret;if(old.env===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=old.env;}
});
test('notificação válida aguarda migração antes de confirmar pagamento no banco',async()=>{
 const old=process.env.PAGBANK_TOKEN;process.env.PAGBANK_TOKEN='test-only';let calls=0;
 const payload=JSON.stringify({reference_id:'1',charges:[{id:'CHARGE-1',status:'PAID',amount:{value:1000}}]});
 const signature=require('node:crypto').createHash('sha256').update('test-only-'+payload).digest('hex');
 const route=load('app/api/pagbank/webhook/route.ts',name=>name==='next/server'?response:name==='node:crypto'?require(name):name.includes('launch-readiness')?{segurancaBancoPronta:async()=>false}:{criarClienteAdmin:()=>{calls++;throw Error('not allowed')}});
 try{const r=await route.POST(new Request('https://botica.test/api/pagbank/webhook',{method:'POST',body:payload,headers:{'x-authenticity-token':signature}}));assert.equal(r.status,503);assert.equal(calls,0);}finally{if(old===undefined)delete process.env.PAGBANK_TOKEN;else process.env.PAGBANK_TOKEN=old;}
});
