---
name: create-page
description: Cria página Nuxt alinhada ao padrão de arquitetura do projeto
argument-hint: "Informe rota, objetivo da página e fontes de dados"
agent: agent
---

# Criar Página Nuxt

Crie/edite uma página Nuxt para este projeto usando:

- [Copilot Instructions](../copilot-instructions.md)
- [Vue Components Rules](../instructions/vue-components.instructions.md)
- [Server API Rules](../instructions/server-api.instructions.md)
- [Directus SDK Rules](../instructions/directus-sdk.instructions.md)
- [INTELLIGENCE.md](../INTELLIGENCE.md)

## 🔌 MCP Directus — Obrigatório

Se a página consumir dados do Directus, **antes de criar**:

```bash
mcporter list directus-cms-capela-sao-jose --schema
```

Verifique:
- Collections necessárias
- Campos disponíveis
- Relacionamentos entre dados

## Requisitos

- `<script setup lang="ts">`
- Auto-imports Nuxt 4 (sem import manual de utilitários auto-importados)
- DRY: usar composables já existentes
- Layout e componentes com Vuetify
- Se houver backend, usar `server/api/*.ts` sem sufixo `.get/.post`
- Sem erros de lint e typecheck

## Estrutura de Página Admin

```vue
<script setup lang="ts">
definePageMeta({ layout: 'admin' })

// Estado e dados
const loading = ref(false)
const { fetchData } = useSomeData()

// Ações
async function handleSave() {
  // ...
}
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Header com título e ações -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-5 ga-3">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Título da Página
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Descrição breve da página
        </p>
      </div>
      <div class="d-flex ga-2">
        <!-- Ações -->
      </div>
    </div>

    <!-- Conteúdo -->
  </v-container>
</template>
```

Contexto do pedido:
${input:task:Descreva a página desejada}
