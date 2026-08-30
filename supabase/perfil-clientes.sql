-- Execute uma vez no SQL Editor. É seguro executar novamente.
create table if not exists public.perfil_clientes (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  cpf text,
  telefone text,
  nascimento date,
  cep text,
  rua text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  atualizado_em timestamptz not null default now()
);

alter table public.perfil_clientes enable row level security;
drop policy if exists "Cliente visualiza o próprio perfil" on public.perfil_clientes;
create policy "Cliente visualiza o próprio perfil" on public.perfil_clientes
  for select using (usuario_id = auth.uid());
drop policy if exists "Cliente cria o próprio perfil" on public.perfil_clientes;
create policy "Cliente cria o próprio perfil" on public.perfil_clientes
  for insert with check (usuario_id = auth.uid());
drop policy if exists "Cliente atualiza o próprio perfil" on public.perfil_clientes;
create policy "Cliente atualiza o próprio perfil" on public.perfil_clientes
  for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
