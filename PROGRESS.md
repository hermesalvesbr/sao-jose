# Implementação — Quermesse Financial Accountability

## Status Geral
✅ Concluído — finalizado em 2026-03-03

## Etapas

| # | Tarefa | Status |
|---|--------|--------|
| 1 | PROGRESS.md criado | ✅ |
| 2 | `usePdvReport.ts` — helpers DRY compartilhados | ✅ |
| 3 | Types: `PdvCashWithdrawal` + `PdvSchedule` em `schema.ts` | ✅ |
| 4 | Composable `usePdv.ts`: CRUD sangria + escala | ✅ |
| 5 | Scripts Directus: sangria + escala | ✅ |
| 6 | Page: `sangria.vue` — Sangria de Caixa com recibo | ✅ |
| 7 | Page: `relatorio-itens.vue` — Vendas por item/categoria | ✅ |
| 8 | Page: `relatorio-consolidado.vue` — Consolidado geral paróquia | ✅ |
| 9 | Page: `escala.vue` — Escala de voluntários por dia | ✅ |
| 10 | `relatorio.vue` aprimorado com seção de sangrias | ✅ |
| 11 | `admin.vue` — navegação atualizada | ✅ |
| 12 | Build + validação final | ✅ |

## Novas Páginas Criadas

- `/admin/pdv/sangria` — Sangria de Caixa com emissão de recibo impresso
- `/admin/pdv/relatorio-itens` — Relatório de vendas por item e categoria (imprimível)
- `/admin/relatorio-consolidado` — Prestação de contas consolidada (Dízimo + Ofertório + Quermesse)
- `/admin/pdv/escala` — Escala de voluntários por dia da novena

## Novas Coleções Directus

- `pdv_cash_withdrawals` — Sangrias de caixa (valor, motivo, operador, data_hora)
- `pdv_schedules` — Escala de voluntários (data, production_point_id, voluntarios, observacao)

## Arquivo DRY

- `app/composables/usePdvReport.ts` — formatCurrency, formatDate, toLocalISO, periodLabel, quick date setters, shared print CSS classes
