-- Valores provisórios para consultar a transportadora; pagamento só após conferência da embalagem real.
begin;

alter table public.produtos
  add column if not exists medidas_confirmadas boolean not null default false;

update public.produtos
set
  peso_kg = case when id in (1, 7) then 0.700 when id in (3, 4, 8) then 0.200 else 0.300 end,
  altura_cm = case when id in (1, 7) then 20 when id in (3, 4, 8) then 12 else 15 end,
  largura_cm = case when id in (1, 7) then 16 when id in (3, 4, 8) then 10 else 12 end,
  comprimento_cm = case when id in (1, 7) then 16 when id in (3, 4, 8) then 8 else 10 end,
  medidas_confirmadas = false
where ativo = true
  and id in (1, 3, 4, 5, 6, 7, 8, 34, 35, 810001, 810002, 810003, 810004, 810005, 810006, 810008, 810009, 810010, 810011)
  and peso_kg is null and altura_cm is null and largura_cm is null and comprimento_cm is null;

commit;
