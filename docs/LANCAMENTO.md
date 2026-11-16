# Liberação da loja Botica

O catálogo pode continuar público. Esta versão não declara a loja pronta para vendas sem validar banco, estoque, entrega e pagamentos. Nenhuma credencial deve ser colocada no GitHub, neste documento ou em mensagens.

## 1. Banco correto e atualização de segurança

O projeto usado pela loja é `euxodutzqcurpeiwelxj`. A conexão disponível para esta manutenção não tinha permissão nesse projeto; portanto, a migração ainda não foi aplicada na produção.

No SQL Editor desse projeto, conferir as tabelas existentes e executar a migração:

`supabase/migrations/20261116030459_harden_store_launch.sql`

Ela é transacional e pode ser reaplicada. Não apaga dados. Revoga escritas de clientes em tabelas comerciais, protege o papel administrativo e deixa a escrita nas rotas autenticadas do servidor. As leituras continuam limitadas ao titular. Torna o bucket de receitas privado, se ele já existir, e corrige o processamento repetido de pagamentos.

A migração exige as estruturas anteriores: banco-completo.sql, perfil-clientes.sql, pos-venda-rastreamento.sql, newsletter.sql e lgpd-seguranca.sql. Não reexecutar cegamente scripts antigos sobre a produção: primeiro conferir quais tabelas/colunas já existem. Os testes automatizados usam essas estruturas em um banco isolado, sem dados reais.

Conferir os administradores existentes:

```sql
select p.id, u.email, p.funcao
from public.perfis p join auth.users u on u.id=p.id
where p.funcao='admin';
```

A função `seguranca_lancamento_pronta()` deve retornar true quando chamada pelo servidor com `service_role`. Clientes comuns não recebem permissão para chamá-la. O teste deve incluir tentativas de alterar o próprio papel, forjar pedidos, editar receitas e ler pedidos de outro cliente; todas devem falhar.

## 2. Estoque e acesso administrativo

`ADMIN_EMAIL` deve apontar para a conta autorizada, com e-mail confirmado. O papel `admin` no banco também é necessário; informar um endereço na tela não concede permissão.

Cadastros antigos recebem `estoque_confirmado=false` até conferência. Nenhuma quantidade é presumida real, inclusive os 100 itens criados pelo fluxo anterior. No painel Produtos, informar a quantidade física, peso e dimensões e usar **Confirmar estoque e medidas**. Novos produtos cadastrados pelo administrador já usam a quantidade informada por ele. A consulta pública de catálogo não cria produtos nem estoque.

## 3. Pagamento

Na Vercel, Production:

- `PAGBANK_TOKEN`: credencial de produção da conta da empresa, cadastrada diretamente na Vercel.
- `PAGBANK_SANDBOX=false` e `MODO_PEDIDO_TESTE=false` já foram ajustados nesta manutenção.
- A rota não possui mais o caminho que marcava pedidos como pagos sem cobrança.

O checkout continua indisponível se faltar token, atualização de segurança ou configuração de entrega. Não habilitar produção com um token Sandbox. Fazer homologação primeiro em ambiente isolado e, com credenciais de produção aprovadas pelo PagBank, realizar compra controlada de baixo valor por Pix e cartão. Confirmar pagamento, retorno, Minha conta, notificações e registro no painel. Não foi feita compra nem cobrança nesta manutenção.

O webhook valida `x-authenticity-token`, valor e identificação do pagamento. Repetir a mesma notificação depois de o pedido passar a enviado não deve baixar estoque novamente nem alterar o status da entrega. Essa situação foi testada no banco isolado.

## 4. Entrega

Escolher uma opção após validação da loja:

- Configurar `MELHOR_ENVIO_TOKEN` e medidas corretas de todos os produtos. A cotação precisa ser confirmada no checkout.
- Usar a tabela própria somente após a empresa conferir preços e prazos e definir `FRETE_TABELA_APROVADA=true`.

Sem confirmação, uma estimativa pode ser exibida para consulta, mas não é usada para aceitar pagamento. A integração com transportadora e os prazos comerciais ainda precisam de teste real.

## 5. E-mails

Conferir `BREVO_API_KEY` e um `EMAIL_REMETENTE` autorizado no Brevo. O contato e Reply-To continuam em `flavio_farmaceutico@hotmail.com`. Não trocar o From para um endereço não validado.

Validar o remetente no Brevo e a autorização das requisições da Vercel; não reduzir restrições de segurança indiscriminadamente. O SMTP de recuperação de senha é configurado separadamente no Supabase. Conferir Site URL e URLs de redirecionamento, confirmação de conta e recuperação de senha no mesmo e em outro aparelho.

Uma falha de rede no envio de notificações não desfaz pedidos ou receitas já registrados. Essa correção não comprova entrega de e-mail: testes de recebimento permanecem obrigatórios e não foram realizados nesta manutenção.

## Diagnóstico de integrações

`npm run check:launch` (também executado após o build) faz consultas somente-leitura ao Supabase e aos remetentes do Brevo, usando as variáveis do ambiente. O resultado nos logs contém apenas estados e o código HTTP do Brevo; não imprime chaves nem dados de clientes. Uma consulta de remetente bem-sucedida no build não comprova que todos os IPs das funções da Vercel poderão enviar e-mails nem que o cliente recebeu a mensagem. SMTP de autenticação e entrega de e-mail precisam ser testados separadamente.

## Evidência automatizada

`npm test` inclui tentativas efetivas de escrita com papéis anon/authenticated em PostgreSQL isolado via PGlite, repetição de notificação de pagamento, bloqueio de checkout incompleto, acesso administrativo e preservação de dados quando o e-mail falha. `npm run build` verifica a compilação e TypeScript.

A aprovação desses testes não substitui a aplicação da migração e a homologação no projeto correto.
