-- Aplicar no projeto da Botica. Transação única; não apaga clientes nem pedidos.
begin;

revoke create on schema public from public, anon, authenticated;

-- Cadastros anteriores só ficam vendáveis após conferência explícita pela loja.
alter table public.produtos add column if not exists estoque_confirmado boolean not null default false;

-- Receitas jamais devem permanecer em bucket público, mesmo que ele já existisse.
do $$ begin
  if to_regclass('storage.buckets') is not null then
    update storage.buckets set public=false where id='receitas-privadas';
  end if;
  if to_regclass('storage.objects') is not null then
    drop policy if exists botica_receitas_sem_acesso_direto on storage.objects;
    create policy botica_receitas_sem_acesso_direto on storage.objects as restrictive
      for all to anon, authenticated
      using (bucket_id <> 'receitas-privadas') with check (bucket_id <> 'receitas-privadas');
  end if;
end $$;

-- Operações de escrita passam exclusivamente pelas rotas autenticadas do servidor.
-- Revoga também privilégios por coluna para não deixar concessões antigas ativas.
do $$
declare t text; c record; p record;
begin
  foreach t in array array['perfis','produtos','enderecos','pedidos','itens_pedido','receitas','perfil_clientes','solicitacoes_pos_venda','solicitacoes_lgpd','newsletter_inscritos'] loop
    if to_regclass('public.' || t) is null then
      raise exception 'Tabela obrigatória ausente: %. Execute os scripts de estrutura antes desta migração.', t;
    end if;
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all privileges on table public.%I from public, anon, authenticated', t);
    for c in select attname from pg_attribute where attrelid = to_regclass('public.' || t) and attnum > 0 and not attisdropped loop
      execute format('revoke select (%I), insert (%I), update (%I), references (%I) on public.%I from public, anon, authenticated', c.attname,c.attname,c.attname,c.attname,t);
    end loop;
    for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy %I on public.%I', p.policyname,t);
    end loop;
    execute format('grant all privileges on table public.%I to service_role',t);
  end loop;
end $$;

grant select on public.produtos to anon, authenticated;
grant select on public.perfis, public.enderecos, public.pedidos, public.itens_pedido,
  public.receitas, public.perfil_clientes, public.solicitacoes_pos_venda, public.solicitacoes_lgpd to authenticated;

-- A função não confia em user_metadata e só consulta o usuário da sessão.
create or replace function public.usuario_e_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.perfis where id=auth.uid() and funcao='admin'
  );
$$;
revoke all on function public.usuario_e_admin() from public;
grant execute on function public.usuario_e_admin() to anon, authenticated, service_role;

create policy produtos_leitura on public.produtos for select to anon, authenticated using (ativo=true or public.usuario_e_admin());
create policy perfis_leitura on public.perfis for select to authenticated using (id=(select auth.uid()));
create policy enderecos_leitura on public.enderecos for select to authenticated using (usuario_id=(select auth.uid()));
create policy pedidos_leitura on public.pedidos for select to authenticated using (usuario_id=(select auth.uid()));
create policy itens_leitura on public.itens_pedido for select to authenticated using (
  exists(select 1 from public.pedidos p where p.id=pedido_id and p.usuario_id=(select auth.uid()))
);
create policy receitas_leitura on public.receitas for select to authenticated using (usuario_id=(select auth.uid()));
create policy clientes_leitura on public.perfil_clientes for select to authenticated using (usuario_id=(select auth.uid()));
create policy pos_venda_leitura on public.solicitacoes_pos_venda for select to authenticated using (usuario_id=(select auth.uid()));
create policy lgpd_leitura on public.solicitacoes_lgpd for select to authenticated using (usuario_id=(select auth.uid()));

-- Webhook repetido não volta o pedido para "pago" nem desconta estoque novamente.
create or replace function public.confirmar_pagamento(p_pedido_id bigint, p_pagamento_id text, p_valor numeric)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_pedido public.pedidos%rowtype; v_item record;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Acesso restrito'; end if;
  if p_pagamento_id is null or length(p_pagamento_id) not between 1 and 200
     or p_valor is null or p_valor::text in ('NaN','Infinity','-Infinity') or p_valor<=0 then
    raise exception 'Pagamento inválido';
  end if;
  select * into v_pedido from public.pedidos where id=p_pedido_id for update;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if round(v_pedido.total,2) <> round(p_valor,2) then raise exception 'Valor divergente'; end if;
  if v_pedido.pago_em is not null then
    if v_pedido.pagamento_id is distinct from p_pagamento_id then raise exception 'Pedido já possui outro pagamento'; end if;
    return true;
  end if;
  if v_pedido.status <> 'aguardando_pagamento' then raise exception 'Pedido não está aguardando pagamento'; end if;
  if not exists(select 1 from public.itens_pedido where pedido_id=p_pedido_id) then raise exception 'Pedido sem itens'; end if;
  for v_item in select produto_id,sum(quantidade)::integer as quantidade from public.itens_pedido where pedido_id=p_pedido_id group by produto_id order by produto_id loop
    update public.produtos set estoque=estoque-v_item.quantidade where id=v_item.produto_id and estoque>=v_item.quantidade and estoque_confirmado=true;
    if not found then raise exception 'Estoque insuficiente'; end if;
  end loop;
  update public.pedidos set status='pago',pagamento_id=p_pagamento_id,pago_em=now() where id=p_pedido_id;
  return true;
end;
$$;
revoke all on function public.confirmar_pagamento(bigint,text,numeric) from public,anon,authenticated;
grant execute on function public.confirmar_pagamento(bigint,text,numeric) to service_role;

-- Marcador e inspeção efetiva de privilégios: configuração ausente falha fechada.
-- Não basta existir a função se alguém voltar a conceder escrita depois.
create or replace function public.seguranca_lancamento_pronta()
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare t text; r text; a text; c record;
begin
  if coalesce(auth.role(),'') <> 'service_role' then return false; end if;
  foreach t in array array['perfis','produtos','enderecos','pedidos','itens_pedido','receitas','perfil_clientes','solicitacoes_pos_venda','solicitacoes_lgpd','newsletter_inscritos'] loop
    if to_regclass('public.'||t) is null or not (select relrowsecurity from pg_class where oid=to_regclass('public.'||t)) then return false; end if;
    foreach r in array array['anon','authenticated'] loop
      foreach a in array array['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
        if has_table_privilege(r,'public.'||t,a) then return false; end if;
      end loop;
      for c in select attname from pg_attribute where attrelid=to_regclass('public.'||t) and attnum>0 and not attisdropped loop
        if has_column_privilege(r,'public.'||t,c.attname,'INSERT') or has_column_privilege(r,'public.'||t,c.attname,'UPDATE') then return false; end if;
      end loop;
    end loop;
  end loop;
  if to_regclass('storage.buckets') is not null then
    if exists(select 1 from storage.buckets where id='receitas-privadas' and public=true) then return false; end if;
  end if;
  if to_regclass('storage.objects') is not null then
    if not exists(select 1 from pg_policy where polrelid=to_regclass('storage.objects') and polname='botica_receitas_sem_acesso_direto' and not polpermissive) then return false; end if;
  end if;
  return not has_function_privilege('anon','public.confirmar_pagamento(bigint,text,numeric)','EXECUTE')
    and not has_function_privilege('authenticated','public.confirmar_pagamento(bigint,text,numeric)','EXECUTE');
end;
$$;
revoke all on function public.seguranca_lancamento_pronta() from public,anon,authenticated;
grant execute on function public.seguranca_lancamento_pronta() to service_role;

-- Não permite que a função antiga de trigger seja chamada pela Data API.
revoke all on function public.criar_perfil_novo_usuario() from public,anon,authenticated;
notify pgrst, 'reload schema';
commit;
