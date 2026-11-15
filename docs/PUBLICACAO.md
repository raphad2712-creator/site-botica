# Publicação da Botica

## Verificações do código

- Testes de catálogo, estoque, carrinho, frete, segurança e CPF: 31 aprovados.
- Compilação de produção e verificação de TypeScript aprovadas.
- Checkout sem configuração mostra indisponibilidade, preservando o carrinho.
- Ambiente PagBank Sandbox é identificado como teste na tela.
- Rota demonstrativa antiga não cria pedidos fictícios.
- Metadados de compartilhamento, sitemap, robots, página 404 e tratamento de erro preparados.

## Pendências para receber pagamentos reais

1. Configurar PAGBANK_TOKEN diretamente nas variáveis Production da Vercel. Não incluir o token no código ou no GitHub.
2. Validar o fluxo no Sandbox conforme CONFIGURAR-PAGAMENTO.md; depois usar token de produção e PAGBANK_SANDBOX=false.
3. Confirmar MODO_PEDIDO_TESTE=false antes do lançamento. O modo administrativo de teste não deve estar ativo na loja publicada.
4. Confirmar a execução de supabase/corrigir-pedidos.sql e conferir a confirmação do webhook, o valor pago e a redução única do estoque.
5. Executar uma compra controlada, verificando Pix, cartão, falha, retorno, Minha conta e preparação do pedido.

Na inspeção das variáveis da Vercel em 14/11/2026, PAGBANK_TOKEN e MELHOR_ENVIO_TOKEN não estavam cadastrados. As credenciais administrativas do Supabase e do e-mail estavam cadastradas; seus valores e funcionamento não foram validados.

## Entrega

Sem MELHOR_ENVIO_TOKEN e dimensões dos produtos, o sistema usa a tabela de entrega estimada da Botica. Confirme essa tabela e os prazos com a loja ou configure a transportadora antes de anunciar entregas nacionais. Um cálculo pela tabela não comprova cotação real da transportadora.

## Revisão visual

A revisão desta alteração no navegador ficou pendente: o serviço de prévia deste ambiente acrescenta opções incompatíveis com next dev. Não houve alteração no layout da vitrine. Validar a prévia Vercel em celular e desktop antes de publicar.

## Como publicar

A alteração está preparada na branch local preparar-publicacao-botica. O envio ao GitHub ficou pendente de autorização explícita. Depois de resolver as pendências acima, enviar a branch ao GitHub, conferir a prévia e integrar em main para o deploy automático da Vercel. Conferir o estado READY e a URL https://site-botica.vercel.app.

## Avaliações

Foi adicionada uma seção com links para o perfil da unidade no Google Maps e para escrever uma avaliação. O identificador do local foi localizado no cadastro Waze da Rua Sol da Meia-Noite, 990. Não foi possível ler os comentários no Google; por isso a seção não reproduz nomes, notas ou textos de clientes. Para adicionar depoimentos, obter os comentários reais e conferir a autoria e o texto antes de publicar.
