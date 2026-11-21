# Ativar pagamentos da Botica

O checkout usa o PagBank hospedado: o cliente escolhe Pix ou cartão no ambiente do PagBank. O token fica somente no servidor da Vercel.

## Estado atual

As migrações do banco foram aplicadas ao projeto Supabase da Botica. O pedido sem cobrança pode ser registrado no checkout enquanto o pagamento real não estiver liberado. Para receber pagamentos reais ainda faltam as configurações e validações abaixo.

## 1. Confirmar estoque e medidas

Entre em `https://site-botica.vercel.app/admin` com a conta administradora `raphad2712@gmail.com`. Confira a quantidade real, peso e medidas de cada produto e confirme no painel. O banco não marca quantidades antigas como conferidas automaticamente.

## 2. Configurar a entrega

Cadastre o token de produção do Melhor Envio como `MELHOR_ENVIO_TOKEN` na Vercel, ou aprove formalmente os valores da tabela de frete da loja e então defina `FRETE_TABELA_APROVADA=true`. Não ative esta última opção antes de conferir os valores que serão cobrados. O checkout recalcula o frete no servidor.

## 3. Obter o token de produção PagBank

Gere o token na conta PagBank da Botica. Configure a URL de notificações conforme o painel do PagBank:

```text
https://site-botica.vercel.app/api/pagbank/webhook
```

Nunca envie o token em chat ou commit e não use a variável pública `NEXT_PUBLIC_`.

## 4. Configurar a Vercel

Em **Vercel > site-botica > Settings > Environment Variables**, selecione **Production** e confira:

```text
PAGBANK_TOKEN = token de produção privado
PAGBANK_SANDBOX = false
MODO_PEDIDO_TESTE = false
SUPABASE_SERVICE_ROLE_KEY = chave service_role do projeto euxodutzqcurpeiwelxj
MELHOR_ENVIO_TOKEN = token de produção de frete (ou FRETE_TABELA_APROVADA = true após aprovação)
```

A chave service_role já está presente no projeto; não a substitua por chave de outro Supabase. Salve as variáveis e faça **Redeploy** em **Deployments** para que o servidor leia os novos valores.

## 5. Conferir antes de aceitar pagamentos

Verifique se o cálculo de frete corresponde ao serviço e destino contratados, se todos os produtos vendidos têm estoque confirmado e se a URL de retorno e as notificações do PagBank atualizam os pedidos. Faça uma compra controlada com um valor pequeno e confira o pedido, o pagamento, o estoque e os e-mails. A integração de e-mail Brevo está retornando HTTP 401 no diagnóstico: atualize ou valide a chave e o remetente antes de depender das notificações.

O botão do checkout pode estar escrito **Pagar** mesmo quando a cobrança ainda não está habilitada. Nesse estado, o fluxo registra um pedido sem cobrar; a cobrança real só fica disponível quando todas as verificações do servidor forem atendidas.
