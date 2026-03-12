# PDV Público

## Objetivo

O `/pdv` foi preparado para atendimento rápido em celular, com foco em venda de itens da quermesse e impressão automática dos tickets logo após a finalização.

## Fluxo de uso

1. Ao abrir `/pdv`, o sistema pede o nome do operador.
2. O operador confirma o nome e começa a vender.
3. O usuário navega pelas tabs das barracas, com `Todos` sempre em primeiro lugar.
4. A busca filtra os produtos visíveis da tab atual.
5. Os itens são adicionados ao carrinho e a quantidade é ajustada no resumo da venda.
6. O operador escolhe a forma de pagamento.
7. Ao finalizar, o sistema registra a venda e imprime os tickets separados por item do carrinho.

## Regras do catálogo público

- A tab `Todos` aparece antes das demais.
- As demais tabs usam a ordem do campo `sort` de `pdv_production_points`.
- A barraca `Lojinha` (`771786ea-9431-411b-8274-28b224bfb5ad`) é ignorada nesse PDV.
- Apenas pontos que realmente possuem produtos aparecem nas tabs.
- Os produtos continuam ordenados por ponto, categoria e `sort_order`.

## Operador

- O nome do operador é obrigatório para começar.
- O nome fica salvo no navegador para facilitar o próximo acesso.
- Tocando no botão do operador no topo, é possível trocar rapidamente de operador.
- A venda usa o relacionamento já existente entre `pdv_sales.operator_id` e `pdv_operators`.

## Impressão

- A venda só deve ser finalizada com a impressora conectada.
- Cada item do carrinho gera um ticket próprio.
- Cada ticket leva número do pedido, nome do item, quantidade, barraca de entrega, pagamento, operador e horário.
- Depois da impressão, a venda é marcada como impressa em `pdv_sales.printed`.

## Arquivos principais

- `app/pages/pdv.vue`: tela pública do PDV.
- `app/composables/usePublicPdv.ts`: estado do catálogo, tabs, carrinho e fechamento da venda.
- `app/composables/useUsbEscPosPrinter.ts`: conexão com a impressora e montagem dos tickets ESC/POS.
- `server/api/pdv/catalog.ts`: catálogo público já filtrado para o PDV.
- `server/api/pdv/sale.ts`: grava venda, itens e baixa estoque.
- `server/api/pdv/printed.ts`: marca a venda como impressa.

## Observações

- A experiência foi pensada para toque e tela pequena.
- A linguagem da tela foi simplificada para operação de balcão.
- A busca e as tabs reduzem o tempo de navegação durante o atendimento.
