# Botica Bioenergética — e-commerce com Supabase

Projeto em Next.js com:

- O mesmo design comercial da versão anterior da Botica.
- Front preservado a partir dos arquivos HTML, CSS e JavaScript enviados pelo cliente.
- Banner, busca, categorias, animações, receita e newsletter.
- Rastreamento dos pedidos com linha do tempo na área do cliente.
- Solicitações de troca, devolução e reembolso com análise administrativa.
- Avisos por e-mail para o administrador e o cliente via Brevo.

## Rastreamento e pós-venda

1. Execute `supabase/pos-venda-rastreamento.sql` no SQL Editor do Supabase.
2. Na Vercel, cadastre `ADMIN_EMAIL`, `EMAIL_REMETENTE` e `BREVO_API_KEY`.
3. Faça um novo deploy para carregar as variáveis.

Para testar o checkout sem Mercado Pago, defina `MODO_PEDIDO_TESTE=true`. Esse modo funciona exclusivamente para a conta cujo e-mail é igual a `ADMIN_EMAIL`: o checkout cria um pedido completo marcado como teste, sem cobrança e sem reduzir o estoque. Antes de publicar para clientes, altere para `false`.

Enquanto nenhuma transportadora estiver integrada, o administrador informa manualmente no painel `/admin` a transportadora, o código, o link e a etapa da entrega. O cliente acompanha tudo em `/minha-conta`. Uma API de transportadora poderá substituir a atualização manual futuramente.
- Produtos em carrossel horizontal no celular.
- Produtos carregados do Supabase.
- Página individual de cada produto.
- Cadastro e login de clientes.
- Carrinho salvo no navegador.
- Carrinho lateral com imagem do produto, quantidades, subtotal e frete.
- Checkout demonstrativo completo, sem cobrança real.
- Frete calculado somente no checkout, após informar o CEP.
- Criação segura de pedidos.
- Histórico de pedidos do cliente.
- Painel administrativo básico para cadastrar e ativar/desativar produtos.
- Banco protegido por Row Level Security (RLS).

## 1. Programas necessários

Instale:

1. Node.js LTS: https://nodejs.org/
2. Visual Studio Code: https://code.visualstudio.com/

Se você já tem a versão antiga aberta, feche o VS Code primeiro. Extraia este ZIP em uma pasta nova e abra somente a pasta `botica-backend` no VS Code. O front-end e o back-end ficam juntos nesse mesmo projeto.

## 2. Preparar o banco no Supabase

1. Entre no projeto do Supabase.
2. Abra **SQL Editor**.
3. Clique em **New query**.
4. No VS Code, abra `supabase/banco-completo.sql`.
5. Copie todo o conteúdo, cole no SQL Editor e clique em **Run**.

O script usa `create table if not exists`, portanto pode ser executado mesmo que a tabela `produtos` já exista.

## 3. Obter a conexão pública

No Supabase:

1. Clique em **Connect**.
2. Selecione **Framework**.
3. Deixe **Next.js** e **App Router** selecionados.
4. Procure as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Nunca use `service_role`, `sb_secret_`, senha do banco ou Direct Connection no navegador.

## 4. Criar o arquivo de configuração

Na raiz do projeto, faça uma cópia de `.env.example` e renomeie para:

```text
.env.local
```

Edite o arquivo:

```env
NEXT_PUBLIC_SUPABASE_URL=COLE_A_URL_DO_PROJETO
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=COLE_A_CHAVE_PUBLICA
MELHOR_ENVIO_TOKEN=COLE_O_TOKEN_PRIVADO
MELHOR_ENVIO_SANDBOX=true
MELHOR_ENVIO_USER_AGENT=Botica Bioenergetica (seu-email@exemplo.com)
CEP_ORIGEM_FRETE=08180050
RATE_LIMIT_SECRET=COLE_UM_VALOR_LONGO_E_ALEATORIO
```

Não coloque aspas e não deixe espaços ao redor do sinal `=`.

Antes de ativar o frete real, execute `supabase/frete-melhor-envio.sql` no SQL Editor e preencha peso e dimensões de todos os produtos no painel administrativo. Use `MELHOR_ENVIO_SANDBOX=true` durante os testes e altere para `false` somente com o token de produção.

Para ativar a Central de Privacidade, a prova de consentimento da newsletter e o limitador distribuído contra abuso, execute também `supabase/lgpd-seguranca.sql` no SQL Editor.

## 5. Instalar e abrir

No VS Code, abra **Terminal > New Terminal** e execute:

```bash
npm install
npm run dev
```

Abra no navegador:

```text
http://localhost:3000
```

Para encerrar, pressione `Ctrl + C` no terminal.

## 6. Testar cadastro e login

1. Clique em **Minha conta**.
2. Escolha **Ainda não tenho uma conta**.
3. Cadastre nome, e-mail e senha.
4. Se o Supabase pedir confirmação de e-mail, abra a mensagem recebida e confirme.
5. Volte ao site e entre na conta.

Para desativar temporariamente a confirmação de e-mail durante o desenvolvimento:

1. Supabase > Authentication > Providers > Email.
2. Desative **Confirm email**.

Reative antes de publicar uma loja real.

## 7. Transformar sua conta em administradora

Primeiro, crie sua conta pelo site. Depois, abra o SQL Editor e execute, trocando o e-mail:

```sql
update public.perfis
set funcao = 'admin'
where id = (
  select id from auth.users
  where email = 'SEU_EMAIL@EXEMPLO.COM'
);
```

Saia e entre novamente no site. Depois abra **Admin**.

## 8. Como os pedidos funcionam

1. O cliente adiciona produtos ao carrinho.
2. Precisa estar conectado para criar o pedido.
3. O servidor consulta novamente preços e estoque no Supabase.
4. O navegador não decide o preço final.
5. O pedido é gravado em `pedidos` e `itens_pedido`.

O pagamento usa Mercado Pago quando as credenciais estão configuradas. O frete consulta o Melhor Envio no servidor quando o token, peso e dimensões estão cadastrados; enquanto a configuração estiver incompleta, o site identifica o valor como estimado.

## 9. Onde editar

| Parte | Arquivo |
|---|---|
| Página inicial e consultas | `app/page.tsx` |
| Seções, filtros e animações | `components/storefront.tsx` |
| Visual do site | `app/globals.css` |
| Cabeçalho | `components/header.tsx` |
| Card do produto | `components/product-card.tsx` |
| Carrinho | `app/carrinho/page.tsx` |
| Carrinho lateral | `components/cart-provider.tsx` |
| Finalização demonstrativa | `app/checkout/page.tsx` e `app/api/checkout/route.ts` |
| Login/cadastro | `app/login/page.tsx` |
| Painel admin | `app/admin/page.tsx` e `app/admin/products.tsx` |
| Banco e segurança | `supabase/banco-completo.sql` |
| LGPD e proteção contra abuso | `supabase/lgpd-seguranca.sql` |

## 10. Segurança importante

- Nunca envie a chave `service_role` para o front-end.
- Nunca publique `.env.local` no GitHub.
- Não aceite preços enviados pelo navegador sem conferir no banco.
- Receitas médicas precisam de armazenamento privado e controle de acesso.
- Pagamentos reais exigem webhooks e validação no servidor.
- Gere `RATE_LIMIT_SECRET` com pelo menos 32 caracteres aleatórios e mantenha-o somente na Vercel.
- Revise periodicamente usuários administradores, dependências, logs e solicitações da Central de Privacidade.
- Antes de vender manipulados, valide o fluxo com o farmacêutico responsável e a Vigilância Sanitária.

## Próximas integrações

1. Upload privado de receitas.
2. Compra e geração automática de etiquetas pelo Melhor Envio.
3. Mercado Pago com Pix e cartão.
4. Webhook de pagamento.
5. Atualização automática de estoque.
6. Fotos enviadas pelo painel administrativo.
