---
name: create-component
description: Cria componente Vue/Vuetify alinhado ao padrão do projeto
argument-hint: "Informe nome do componente, caminho e objetivo"
agent: agent
---

Crie um componente novo para este projeto Nuxt 4 + Vuetify 4 seguindo rigorosamente:

- Regras de [.github/copilot-instructions.md](../copilot-instructions.md)
- Regras de [Vue Components](../instructions/vue-components.instructions.md)
- Regras de [Vuetify](../instructions/vuetify.instructions.md)
- Regras de [TypeScript](../instructions/typescript.instructions.md)

Requisitos obrigatórios:

- `<script setup lang="ts">`
- Sem imports manuais de auto-imports Nuxt/Vue
- DRY (reaproveitar utilitários/composables existentes quando aplicável)
- Sem `any`
- Resultado sem erro de lint/typecheck

Contexto do pedido:
${input:task:Descreva o componente desejado}
