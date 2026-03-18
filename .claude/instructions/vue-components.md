---
name: vue-components
description: Padrões para componentes Vue no projeto São José
globs: ["app/**/*.vue"]
order: 2
---

# Vue Components — São José

## Script Setup

```typescript
// ✅ SEMPRE use
<script setup lang="ts">

// ❌ NUNCA use Options API
```

## Auto-imports (Não Importe Manualmente)

```typescript
// ❌ NÃO FAÇA
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { definePageMeta, useHead } from '#app'

// ✅ FAÇA — Use diretamente
const count = ref(0)
const route = useRoute()
definePageMeta({ layout: 'admin' })
```

## Props e Emits Tipados

```typescript
interface Props {
  itemId?: string
  title?: string
  loading?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  itemId: '',
  title: 'Título Padrão',
  loading: false,
})

interface Emits {
  save: [data: FormData]
  cancel: []
}
const emit = defineEmits<Emits>()
```

## Padrão Página Admin

```vue
<template>
  <v-container fluid class="pa-4 pa-md-6">
    <div class="d-flex flex-wrap justify-space-between align-center mb-5 ga-3">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Título
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Descrição
        </p>
      </div>
      <div class="d-flex ga-2">
        <v-btn variant="tonal" color="info" prepend-icon="mdi-printer">Imprimir</v-btn>
        <v-btn variant="elevated" color="success" prepend-icon="mdi-plus">Novo</v-btn>
      </div>
    </div>
    <!-- Conteúdo -->
  </v-container>
</template>
```

## Botões por Ação

| Ação | Variant | Color | Ícone |
|------|---------|-------|-------|
| Criar/Adicionar | `elevated` | `success` | `mdi-plus` |
| Salvar | `elevated` | `primary` | `mdi-check` |
| Imprimir | `tonal` | `info` | `mdi-printer` |
| Editar | `icon` small | `primary` | `mdi-pencil` |
| Excluir | `tonal` | `error` | `mdi-trash-can` |
| Cancelar | `text` | — | `mdi-close` |
| Voltar | `text` | — | `mdi-arrow-left` |

## Vuetify — Proibições

```vue
<!-- ❌ NUNCA -->
<v-row dense />
<v-list-item active-color="primary" />
<v-data-table dense />
<div style="color: #1976D2" />

<!-- ✅ CORRETO -->
<v-row class="ga-2" />
<v-list-item color="primary" />
<v-data-table density="compact" />
<div class="text-primary" />
```
