# Oito produtos da Botica

As fotografias em `public/produtos/linha-natural/` são os oito JPEGs fornecidos pela loja, preservados sem recortes ou alterações. Cada produto tem uma foto individual com fundo branco. O Next.js gera versões menores para os cards e os destaques.

Os dados de `lib/consultation-products.ts` reproduzem somente os rótulos: nome, concentração e frasco com 60 cápsulas. As informações ficam em texto abaixo da foto na página de cada produto. Os preços demonstrativos foram autorizados pela loja e ficam no campo `precoDemonstrativo`. Não são usados em cobranças reais; estoque e dados de checkout continuam dependendo do cadastro no banco.

Enquanto não existir um cadastro correspondente no banco, o item mostra seu valor com a indicação “Preço demonstrativo” e permite falar com a Botica. O contato usa `NEXT_PUBLIC_SUPPORT_EMAIL`, com o mesmo endereço de fallback do suporte existente.

Para disponibilizar a compra, cadastre no painel o nome completo (por exemplo, “Passiflora 300 mg — 60 cápsulas”), descrição aprovada, preço e estoque reais. Um cadastro ativo com nome e concentração correspondentes substitui os dados demonstrativos e é reconhecido também no endereço permanente `/produto/passiflora-300mg`. Dosagens, fórmulas combinadas ou quantidades diferentes não recebem a fotografia deste rótulo.

O carrossel avança a cada sete segundos quando está visível. Setas, indicadores, teclado e gesto horizontal mudam um destaque completo. A interação pausa o avanço; o botão reproduzir o retoma. A passagem do mouse, a aba em segundo plano e a preferência por movimento reduzido suspendem as animações automáticas.

As páginas dos oito produtos exibem as artes completas fornecidas pela loja em `public/produtos/artes/`, com a proporção original e opção de ampliação. Os cards e o carrossel mantêm as fotografias isoladas em fundo branco. Setas e outros símbolos da vitrine, do cabeçalho, do rodapé e das páginas de produto são SVGs de `components/ui-icon.tsx`.

Validação das regras do catálogo: `node --test tests/catalog.test.cjs`.
