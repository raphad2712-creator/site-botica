# Ativar pagamentos da Botica

O checkout usa o PagBank hospedado: o cliente escolhe Pix ou cartão no ambiente do PagBank. O token fica somente no servidor da Vercel.

## Roteiro para configurar o token

1. Entre na conta **PagBank da Botica**, pelo computador. Abra **Vendas > Integrações > Gerar Token** e obtenha o token **de produção**. Se a tela oferecer o token já existente, reutilize-o: gerar outro pode invalidar o anterior.
2. Entre em **Vercel > site-botica > Settings > Environment Variables**. Crie ou edite a variável `PAGBANK_TOKEN`, cole o token no campo **Value**, marque **Production** e salve. Não envie o valor pelo WhatsApp, chat ou GitHub.
3. Na mesma tela, confira `PAGBANK_SANDBOX=false` e `MODO_PEDIDO_TESTE=false` em **Production**. A chave `SUPABASE_SERVICE_ROLE_KEY` já está cadastrada; não a substitua.
4. Abra **Deployments** na Vercel, escolha o deploy de produção mais recente e clique em **Redeploy**, mantendo as variáveis de ambiente de produção. Aguarde o status **Ready**.
5. Faça uma compra controlada no site: coloque um produto no carrinho, calcule o frete, clique em **Pagar** e conclua um pagamento pequeno no PagBank. Confira o pedido, o valor, o estoque e a notificação no painel. O pagamento é real e pode gerar cobrança; use os dados da loja e combine o teste com o responsável.

**Antes do passo 5:** o frete de produção ainda precisa do token `MELHOR_ENVIO_TOKEN` e das medidas dos produtos, ou de aprovação dos valores da tabela atual para habilitar `FRETE_TABELA_APROVADA=true`. O token PagBank sozinho não libera o pagamento enquanto esse ponto estiver pendente.

## Estado atual

As migrações do banco foram aplicadas ao projeto Supabase da Botica. Por solicitação do responsável, os **19 produtos ativos foram definidos com 15 unidades cada**. Essa quantidade foi estimada e deve ser conferida fisicamente na loja. Para receber pagamentos reais ainda faltam as configurações e validações abaixo.

## 1. Confirmar estoque e medidas

Entre em `https://www.boticabioenergetica.com.br/admin` com uma conta administradora. A troca para `flavio_farmaceutico@hotmail.com` depende de cadastrar e confirmar esse e-mail na loja; até lá, o acesso administrativo existente permanece ativo. Confira fisicamente se as 15 unidades estimadas de cada produto estão corretas. Preencha peso e medidas de cada produto se for usar o Melhor Envio. O estoque pode ser corrigido no painel caso a contagem real seja diferente.

## 2. Configurar a entrega

Cadastre o token de produção do Melhor Envio como `MELHOR_ENVIO_TOKEN` na Vercel, ou aprove formalmente os valores da tabela de frete da loja e então defina `FRETE_TABELA_APROVADA=true`. Não ative esta última opção antes de conferir os valores que serão cobrados. O checkout recalcula o frete no servidor.

## 3. Obter o token de produção PagBank

Gere o token na conta PagBank da Botica. Configure a URL de notificações conforme o painel do PagBank:

```text
https://www.boticabioenergetica.com.br/api/pagbank/webhook
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

O webhook aceita a assinatura antiga e a assinatura ECDSA atual do PagBank. Com o token, busca automaticamente a chave pública de notificações. Caso o PagBank informe uma URL de produção diferente para a consulta da chave, é possível cadastrar `PAGBANK_WEBHOOK_PUBLIC_KEY` com o valor Base64 da chave X.509 emitida pelo PagBank; não use uma chave gerada por conta própria. Essa chave é pública, mas o token continua privado.

A chave service_role já está presente no projeto; não a substitua por chave de outro Supabase. Salve as variáveis e faça **Redeploy** em **Deployments** para que o servidor leia os novos valores.

## 5. Conferir antes de aceitar pagamentos

Verifique se o cálculo de frete corresponde ao serviço e destino contratados, se todos os produtos vendidos têm estoque confirmado e se a URL de retorno e as notificações do PagBank atualizam os pedidos. Faça uma compra controlada com um valor pequeno e confira o pedido, o pagamento, o estoque e os e-mails. A integração de e-mail Brevo está retornando HTTP 401 no diagnóstico. O remetente `flavio_farmaceutico@hotmail.com` ainda precisa concluir a verificação na conta Brevo, e o bloqueio de IPs não autorizados está ativo. Regularize esses pontos antes de depender das notificações por e-mail.

O botão do checkout pode estar escrito **Pagar** mesmo quando a cobrança ainda não está habilitada. Nesse estado, o fluxo registra um pedido sem cobrar; a cobrança real só fica disponível quando todas as verificações do servidor forem atendidas.
