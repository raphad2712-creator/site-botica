# Configurar o pagamento da Botica

O código já está preparado para o Checkout Pro do Mercado Pago. Comece com credenciais de teste.

## 1. Atualizar o banco

No Supabase, abra **SQL Editor**, crie uma nova consulta, cole todo o conteúdo de `supabase/corrigir-pedidos.sql` e execute.

## 2. Obter a chave administrativa do Supabase

No Supabase, abra **Project Settings > API Keys** e copie a chave `service_role`. Ela é secreta.

## 3. Criar a integração do Mercado Pago

No painel Mercado Pago Developers, abra **Suas integrações**, crie uma aplicação para pagamentos on-line e copie o **Access Token de teste**.

Em **Webhooks**, cadastre esta URL:

```text
https://site-botica.vercel.app/api/mercado-pago/webhook
```

Selecione o evento de pagamentos e copie a assinatura secreta gerada para o webhook.

## 4. Configurar a Vercel

Em **Vercel > projeto > Settings > Environment Variables**, adicione para Production e Preview:

```text
SUPABASE_SERVICE_ROLE_KEY = chave service_role do Supabase
MERCADO_PAGO_ACCESS_TOKEN = Access Token de teste do Mercado Pago
MERCADO_PAGO_WEBHOOK_SECRET = assinatura secreta do webhook
```

Não use o prefixo `NEXT_PUBLIC_` nessas três variáveis. Não coloque os valores no GitHub nem envie prints das chaves.

Depois, abra **Deployments**, selecione o último deploy e clique em **Redeploy**.

## 5. Testar

Use somente os usuários e cartões de teste fornecidos pelo Mercado Pago. Confirme se:

1. O checkout abre no Mercado Pago.
2. O pagamento aprovado retorna ao site.
3. O pedido aparece como `pago` em Minha conta.
4. O estoque é reduzido uma única vez.

Somente depois dos testes substitua o Access Token de teste pela credencial de produção e atualize o webhook da aplicação de produção.
