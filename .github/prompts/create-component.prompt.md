---
name: create-component
description: Cria componente Vue/Vuetify alinhado ao padrão do projeto
argument-hint: "Informe nome do componente, caminho e objetivo"
agent: agent
---

# Criar Componente Vue

Crie um componente novo para este projeto Nuxt 4 + Vuetify 4 seguindo rigorosamente:

- Regras de [.github/copilot-instructions.md](../copilot-instructions.md)
- Regras de [Vue Components](../instructions/vue-components.instructions.md)
- Regras de [Vuetify](../instructions/vuetify.instructions.md)
- Regras de [TypeScript](../instructions/typescript.instructions.md)
- Padrões de [.github/INTELLIGENCE.md](../INTELLIGENCE.md)

## 🔌 MCP Directus — Obrigatório

Se o componente consumir dados do Directus, **antes de criar**:

```bash
mcporter list directus-cms-capela-sao-jose --schema
```

Verifique:
- Nome exato dos campos
- Tipos de dados
- Relacionamentos entre collections

## Requisitos Obrigatórios

- `<script setup lang="ts">`
- Sem imports manuais de auto-imports Nuxt/Vue
- DRY (reaproveitar utilitários/composables existentes quando aplicável)
- Sem `any`
- Resultado sem erro de lint/typecheck

## Estrutura Esperada

```vue
<script setup lang="ts">
// Props tipadas
interface Props {
  // ...
}
const props = defineProps<Props>()

// Emits tipados
interface Emits {
  // ...
}
const emit = defineEmits<Emits>()

// Estado e lógica
</script>

<template>
  <!-- UI com Vuetify -->
</template>
```

Contexto do pedido:
${input:task:Descreva o componente desejado}
