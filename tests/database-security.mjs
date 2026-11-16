import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
const root=new URL('../',import.meta.url);
const sql=name=>readFileSync(new URL('supabase/'+name,root),'utf8');
const uid='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
let db;
async function as(role,id,query){
  await db.exec(`reset role;set request.jwt.claim.sub='${id}';set request.jwt.claim.role='${role}';set role ${role};`);
  return db.query(query);
}
test('privilégios reais: bloqueia promoção, pedidos forjados e alteração de receitas; preserva leitura do próprio cliente',async()=>{
 db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
 create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;
 create schema storage;
 create table storage.buckets(id text primary key,public boolean);
 create table storage.objects(id integer,bucket_id text);
 alter table storage.objects enable row level security;
 grant usage on schema storage to anon,authenticated,service_role;
 grant select on storage.objects to anon,authenticated;
 create policy legacy_read_everything on storage.objects for select to anon,authenticated using(true);
 insert into storage.buckets values('receitas-privadas',true);
 insert into storage.objects values(1,'receitas-privadas');
 grant usage on schema public,auth to anon,authenticated,service_role;
 grant execute on function auth.uid(),auth.role() to anon,authenticated,service_role;
 alter default privileges in schema public grant all on tables to anon,authenticated,service_role;`);
 for(const file of ['banco-completo.sql','perfil-clientes.sql','pos-venda-rastreamento.sql','newsletter.sql','lgpd-seguranca.sql'])await db.exec(sql(file));
 await db.exec(`insert into auth.users(id) values('${uid}'),('${other}');
 insert into public.produtos(id,nome,descricao,categoria,preco,estoque) values(1,'Produto','Teste','Naturais',10,8);
 insert into public.pedidos(id,usuario_id,total) values(1,'${uid}',20),(2,'${other}',10);
 insert into public.itens_pedido(pedido_id,produto_id,quantidade,preco_unitario) values(1,1,2,10);
 insert into public.receitas(id,usuario_id,arquivo_url) values(1,'${uid}','private.pdf');`);
 await db.exec(sql('migrations/20261116030459_harden_store_launch.sql'));
 await db.exec(sql('migrations/20261116030459_harden_store_launch.sql')); // reaplicação segura
 await db.exec('update public.produtos set estoque_confirmado=true where id=1');
 for(const query of [`update public.perfis set funcao='admin' where id='${uid}'`,
 `insert into public.pedidos(usuario_id,total,status) values('${uid}',0,'pago')`,
 `insert into public.itens_pedido(pedido_id,produto_id,quantidade,preco_unitario) values(1,1,2,0)`,
 `update public.receitas set status='aprovada' where id=1`,
 `select public.confirmar_pagamento(1,'CHARGE-1',20)`]){
  await assert.rejects(as('authenticated',uid,query),/permission denied/);
 }
 assert.deepEqual((await as('authenticated',uid,'select id from public.pedidos order by id')).rows,[{id:1}]);
 assert.deepEqual((await as('authenticated',uid,'select * from storage.objects')).rows,[]);
 assert.deepEqual((await as('anon','', 'select * from storage.objects')).rows,[]);
 assert.equal((await as('authenticated',uid,`select funcao from public.perfis where id='${uid}'`)).rows[0].funcao,'cliente');
 assert.equal((await as('service_role',uid,'select public.seguranca_lancamento_pronta() as ok')).rows[0].ok,true);
});
test('pagamento exige valor exato, só baixa estoque uma vez e mantém estado de entrega no replay',async()=>{
 await assert.rejects(as('service_role',uid,`select public.confirmar_pagamento(1,'CHARGE-1',1)`),/Valor divergente/);
 await as('service_role',uid,`select public.confirmar_pagamento(1,'CHARGE-1',20)`);
 await as('service_role',uid,`update public.pedidos set status='enviado' where id=1`);
 await as('service_role',uid,`select public.confirmar_pagamento(1,'CHARGE-1',20)`);
 assert.equal((await as('service_role',uid,'select estoque from public.produtos where id=1')).rows[0].estoque,6);
 assert.equal((await as('service_role',uid,'select status from public.pedidos where id=1')).rows[0].status,'enviado');
 await assert.rejects(as('service_role',uid,`select public.confirmar_pagamento(1,'OTHER',20)`),/outro pagamento/);
});
test('verificação de lançamento reprova concessão por coluna mesmo sem UPDATE na tabela',async()=>{
 await db.exec('reset role; grant update(funcao) on public.perfis to authenticated');
 assert.equal((await as('service_role',uid,'select public.seguranca_lancamento_pronta() as ok')).rows[0].ok,false);
 await db.close();
});
