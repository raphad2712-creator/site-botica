# Configurar o pagamento da Botica com PagBank

O site usa o Checkout PagBank hospedado. O cliente é redirecionado ao ambiente seguro do PagBank, escolhe Pix ou cartão e volta ao site após o pagamento.

## 1. Atualizar o banco

No Supabase, abra **SQL Editor**, crie uma nova consulta, cole todo o conteúdo de `supabase/corrigir-pedidos.sql` e execute.

## 2. Obter a chave administrativa do Supabase

No Supabase, abra **Project Settings > API Keys** e copie a chave `service_role`. Ela é secreta.

## 3. Obter o token do PagBank

Entre no ambiente de desenvolvedores do PagBank e gere primeiro um token de Sandbox. Não coloque esse token no GitHub e não use o prefixo `NEXT_PUBLIC_`.

O site já envia esta URL ao PagBank para receber as notificações de pagamento:

```text
https://site-botica.vercel.app/api/pagbank/webhook
```

## 4. Configurar a Vercel

Em **Vercel > projeto > Settings > Environment Variables**, adicione para Production e Preview:

```text
SUPABASE_SERVICE_ROLE_KEY = chave service_role do Supabase
PAGBANK_TOKEN = token privado do PagBank
PAGBANK_SANDBOX = true
```

Depois, abra **Deployments**, selecione o último deploy e clique em **Redeploy**.

## 5. Testar no Sandbox

Use os dados de teste fornecidos pelo PagBank e confirme se:

1. O checkout abre no PagBank.
2. Pix e cartão aparecem como opções.
3. O pagamento aprovado retorna ao site.
4. O pedido aparece como `pago` em Minha conta.
5. O estoque é reduzido uma única vez.

## 6. Ativar pagamentos reais

Somente depois dos testes, substitua o token pelo token de produção, altere `PAGBANK_SANDBOX` para `false` e faça um novo deploy.
