# Linha natural e compra

Os oito produtos usam os arquivos originais: primeiro a foto de `public/produtos/linha-natural/`, depois a arte de `public/produtos/artes/`. No tema escuro, a primeira foto é substituída pela versão de fundo preto em `public/produtos/linha-natural-dark/`, criada com o produto e o rótulo preservados. As cópias PNG temporárias foram convertidas em JPEG otimizado para o site; os arquivos gerados originais continuam preservados. A galeria permite deslize horizontal, setas, miniaturas, teclado e ampliação da imagem selecionada.

Adicionar ao carrinho resolve o cadastro em POST `/api/catalogo/[slug]`, restrito aos oito slugs. Cadastros existentes preservam preço, estoque e disponibilidade. Na ausência de cadastro, cria uma linha com ID livre gerado pelo banco, preço inicial autorizado e estoque demonstrativo inicial de 100 unidades. O painel permite ajustar esses valores. Não reabastece nem reativa produtos existentes. A chave administrativa permanece no servidor.

O carrinho recebe o ID persistido, foto, nome e preço do banco. O checkout existente valida preço e estoque novamente; as configurações atuais de pagamento continuam valendo.

O carrossel de destaques não tem botão de pausar nem barra inferior de progresso. Mantém setas, indicadores, gesto e teclado. Interação, passagem do mouse, aba oculta e movimento reduzido interrompem o avanço automático.

Testes: `node --test tests/catalog.test.cjs tests/natural-purchase.test.cjs`.
