-- Execute este arquivo no SQL Editor do Supabase antes de ativar o Melhor Envio.
-- É seguro executar novamente.

alter table public.produtos
  add column if not exists peso_kg numeric(8,3) check (peso_kg > 0),
  add column if not exists altura_cm numeric(8,2) check (altura_cm > 0),
  add column if not exists largura_cm numeric(8,2) check (largura_cm > 0),
  add column if not exists comprimento_cm numeric(8,2) check (comprimento_cm > 0);

alter table public.pedidos
  add column if not exists transportadora text;
