---
name: Vue Components (Nuxt 4)
description: Regras para componentes e páginas Vue com script setup + Vuetify
applyTo: "app/**/*.vue"
---

# Vue Components Rules

## Script Setup

- Use `<script setup lang="ts">` only.
- Never use Options API.
- Never manually import Nuxt/Vue auto-imports (`ref`, `computed`, `watch`, `onMounted`, `useRoute`, `useRouter`, `definePageMeta`, `useHead`, `useSeoMeta`, etc.).

## Props e Emits Tipados

```vue
<script setup lang="ts">
// Props com defaults
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

// Emits tipados
interface Emits {
  save: [data: FormData]
  cancel: []
  error: [error: Error]
}
const emit = defineEmits<Emits>()
</script>
```

## Padrão de Página Admin

```vue
<script setup lang="ts">
definePageMeta({ layout: 'admin' })

// Estado
const loading = ref(false)
const { fetchData } = useSomeData()

// Ações
async function handleSave() {
  // ...
}
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Header -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-5 ga-3">
      <div>
        <div class="d-flex align-center mb-2">
          <v-btn
            v-if="$route.path !== '/admin'"
            variant="text"
            icon="mdi-arrow-left"
            class="me-2"
            to="/admin"
          />
          <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
            Título da Página
          </h1>
        </div>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0 ms-11">
          Descrição breve da página
        </p>
      </div>
      <div class="d-flex ga-2">
        <v-btn variant="tonal" color="info" prepend-icon="mdi-printer" @click="printPage">
          Imprimir
        </v-btn>
        <v-btn variant="elevated" color="success" prepend-icon="mdi-plus" to="/admin/rota/add">
          Novo
        </v-btn>
      </div>
    </div>

    <!-- Conteúdo -->
  </v-container>
</template>
```

## Padrão de Botões por Ação

| Ação | Variant | Color | Icon |
|------|---------|-------|------|
| Criar/Adicionar | `elevated` | `success` | `mdi-plus` |
| Salvar | `elevated` | `primary` | `mdi-check` |
| Imprimir/Exportar | `tonal` | `info` | `mdi-printer` |
| Editar | `icon` (small) | `primary` | `mdi-pencil` |
| Excluir/Arquivar | `tonal` | `error` | `mdi-trash-can` |
| Cancelar | `text` | — | `mdi-close` |
| Voltar | `text` | — | `mdi-arrow-left` |

## Layout com Vuetify

```vue
<template>
  <!-- Grid responsivo -->
  <v-row align="center">
    <v-col cols="12" sm="6" md="4">
      <!-- Conteúdo -->
    </v-col>
  </v-row>

  <!-- Espaçamento -->
  <div class="pa-4 ma-2">
    <div class="mt-4 mb-2">
      Conteúdo com margin top
    </div>
  </div>

  <!-- Flexbox -->
  <div class="d-flex align-center justify-space-between">
    <div>Conteúdo à esquerda</div>
    <div>Conteúdo à direita</div>
  </div>

  <!-- Responsivo -->
  <div class="flex-column flex-sm-row">
    <!-- Mobile: coluna, Desktop: linha -->
  </div>
</template>
```

## Classes Utilitárias

```vue
<template>
  <!-- Tipografia -->
  <h1 class="text-h4 font-weight-bold">Título</h1>
  <p class="text-body-2 text-medium-emphasis">Descrição</p>
  <span class="text-caption text-error">Erro</span>

  <!-- Cores do tema -->
  <div class="text-primary">Texto primário</div>
  <div class="bg-surface-variant">Fundo variante</div>

  <!-- Bordas e elevação -->
  <v-card rounded="xl" :elevation="0" class="border">
    Card com borda e sem sombra
  </v-card>
</template>
```

## Componentes que se Auto-registram

```
app/components/
├── form/
│   └── Input.vue        → <FormInput />
├── pdv/
│   └── ProductCard.vue  → <PdvProductCard />
└── print/
    └── ReportHeader.vue → <PrintReportHeader />
```

**Regra:** Nome do arquivo = nome do componente (PascalCase). Pasta + Nome = Prefixo.

## DRY Rules

- Keep UI logic in components and business logic in composables.
- Reuse existing components/composables before creating new ones (DRY).
- Prefer computed values over repeated template expressions.
- Extract repeated patterns into smaller components.

## Proibições Vuetify 4

```vue
<!-- ❌ NUNCA USE -->
<v-row dense /> <!-- Removido -->
<v-list-item active-color="primary" /> <!-- Use color="primary" -->
<v-data-table dense /> <!-- Use density="compact" -->
<v-number-input /> <!-- Lado -- use v-list + botões -->
<div style="color: #1976D2" /> <!-- Use class="text-primary" -->

<!-- ✅ CORRETO -->
<v-row class="ga-2" />
<v-list-item color="primary" />
<v-data-table density="compact" />
<v-btn color="primary" />
<div class="text-primary" />
```

## SEO Meta Tags

```vue
<script setup lang="ts">
definePageMeta({ layout: 'admin' })

useHead({
  title: 'Título da Página | Capela São José',
})

useSeoMeta({
  title: 'Título da Página',
  description: 'Descrição da página para SEO',
  ogTitle: 'Título da Página',
  ogDescription: 'Descrição da página para SEO',
})
</script>
```

## Referências

- `.github/INTELLIGENCE.md` — Guia completo de padrões
- `.github/instructions/vuetify.instructions.md` — Padrões Vuetify específicos
- `app/plugins/vuetify.ts` — Configuração do tema
- `app/pages/admin/pdv/index.vue` — Exemplo de página admin
