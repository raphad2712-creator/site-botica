-- Ajustes recebidos em 30/10/2026 para produtos já cadastrados.
-- Execute no SQL Editor do projeto correto, depois de conferir as linhas.
-- Não altera estoque, não cria vendas e não inventa dosagens.
begin;
update public.produtos set preco = 55.90 where lower(nome) like 'passiflora%' and lower(nome) not like '%compost%';
update public.produtos set preco = 79.90 where lower(nome) like 'isoflavona%';
update public.produtos set preco = 85.90 where lower(nome) like 'turkesterone%';
update public.produtos set preco = 59.90 where lower(nome) like 'saw palmetto%';
update public.produtos set preco = 95.00 where lower(nome) like 'berberina%';
update public.produtos set preco = 99.90 where lower(nome) like 'creatina monohidratada%' and (lower(nome) like '%300g%' or lower(nome) like '%300 g%');
update public.produtos set preco = 89.90, descricao = 'Magnésio quelado 50 mg, dimalato 100 mg, treonato 200 mg, citrato 100 mg e taurato 50 mg por dose. 60 cápsulas / 30 doses.' where lower(nome) like 'blend%magn%sio%';
update public.produtos set preco = 39.90 where lower(nome) like 'floral rescue%' and lower(nome) like '%30%';
update public.produtos set preco = 99.90, descricao = 'Tribulus terrestris 300 mg, ginseng 50 mg, catuaba 100 mg, maca peruana 60 mg, feno-grego 50 mg, mucuna pruriens 50 mg, ashwagandha 30 mg, zinco quelado 5 mg e turkesterone q.s. 30 cápsulas.' where lower(nome) like 'testo+%' or lower(nome) like 'testo +%';
update public.produtos set preco = 29.90, nome = 'Vit B12 (Metilcobalamina) 30 cápsulas' where lower(nome) like '%metilcobalamina%' and lower(nome) not like '%compost%';
update public.produtos set preco = 29.00 where (lower(nome) like 'vit d 1000%' or lower(nome) like 'vitamina d 1000%') and lower(nome) like '%30%';
commit;
-- Glucomanan, Tribulus Terrestris e Maca Peruana mantidos sem alterações.
-- Produtos que ainda não existem em public.produtos devem ser cadastrados com estoque e medidas reais pelo painel /admin.
