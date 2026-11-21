-- Public catalog reads only active products. Administrative reads use the server role.
drop policy if exists produtos_leitura on public.produtos;
create policy produtos_leitura on public.produtos
  for select to anon, authenticated using (ativo = true);

-- Administrative helper is not a public RPC.
revoke all on function public.usuario_e_admin() from public, anon, authenticated;
grant execute on function public.usuario_e_admin() to service_role;
