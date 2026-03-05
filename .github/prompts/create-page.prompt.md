---
name: create-page
description: Cria página Nuxt alinhada ao padrão de arquitetura do projeto
argument-hint: "Informe rota, objetivo da página e fontes de dados"
agent: agent
---

Crie/edite uma página Nuxt para este projeto usando:

- [Copilot Instructions](../copilot-instructions.md)
- [Vue Components Rules](../instructions/vue-components.instructions.md)
- [Server API Rules](../instructions/server-api.instructions.md)
- [Directus SDK Rules](../instructions/directus-sdk.instructions.md)

Requisitos:

- `<script setup lang="ts">`
- Auto-imports Nuxt 4 (sem import manual de utilitários auto-importados)
- DRY: usar composables já existentes
- Layout e componentes com Vuetify
- Se houver backend, usar `server/api/*.ts` sem sufixo `.get/.post`
- Sem erros de lint e typecheck

Contexto do pedido:
${input:task:Descreva a página desejada}
