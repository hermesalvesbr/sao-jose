# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack Overview

- **Frontend:** Nuxt 4 + Vue 3 (Composition API only) + Vuetify 4 + TypeScript
- **Backend/CMS:** Directus 11 (PostgreSQL) via `@directus/sdk`
- **Runtime:** Bun (v1.x, Node >=20)
- **State:** Vue composables with `ref`/`computed`, no Pinia

## Core Commands

```bash
bun install          # Install dependencies
bun run dev          # Development server
bun run build        # Build (runs lint + typecheck first)
bun run typecheck    # TypeScript validation
bun run lint         # ESLint validation
bun run gen:types    # Regenerate Directus types from schema
```

## Architecture

### Frontend (`app/`)

```
app/
├── components/       # Auto-registered Vue components (PascalCase)
│   ├── pdv/         # PDV-specific components
│   ├── print/       # Print report components
│   └── birthday/    # Birthday components
├── composables/      # Reusable logic (use* prefix)
├── layouts/          # admin.vue (sidebar), default.vue (public)
├── middleware/       # auth.global.ts (auto-auth on admin routes)
├── pages/            # File-based routing
│   ├── admin/       # Admin area (protected)
│   └── pdv.vue      # PDV terminal (fullscreen, no layout)
├── plugins/          # Vuetify setup
├── types/            # Directus-generated schema types
└── utils/            # Pure utility functions
```

### Server (`server/`)

```
server/
├── api/              # Server-side endpoints (neutral names, no .get/.post suffix)
│   ├── pdv/         # PDV operations (sale.ts, catalog.ts, operator.ts)
│   └── ...
└── utils/
    └── directus.ts   # createServerDirectusClient(event)
```

## Key Conventions

### 1. TypeScript Strict

- Zero `any` types — use `ApiCollections` types from `app/types/schema.ts`
- Typable function returns and composable outputs

### 2. Nuxt Auto-imports

Do NOT manually import: `ref`, `computed`, `watch`, `onMounted`, `useRoute`, `useRouter`, `navigateTo`, `definePageMeta`, `useHead`, `useSeoMeta`, `useState`, `$fetch`, or composables from `app/composables/*`.

### 3. Directus Integration

**MCP Directus — Consult Before Generating Data Code:**

```bash
mcporter list directus-cms-capela-sao-jose --schema
mcporter call directus-cms-capela-sao-jose.items action=read collection=<collection>
```

**Client Types:**
```typescript
// Authenticated (user logged in)
const { getAuthClient } = useAuth()
const client = await getAuthClient()

// Static token (public pages)
const { public: { directus: { token } } } = useRuntimeConfig()
const { getStaticClient } = useAuth()
const client = getStaticClient(token)

// Server-side (token never exposed)
const client = createServerDirectusClient(event)
```

**Query Patterns:**
- Use typed SDK: `readItems`, `createItem`, `updateItem`, `deleteItem`, `uploadFiles`
- Filter at database level, not client-side
- Use aggregations (`count`, `sum`, `avg`) instead of client processing
- Avoid N+1 — fetch relations in single query via `fields` option

### 4. Vuetify 4

- Use theme tokens (`primary`, `secondary`, `error`) — never hex colors inline
- Use grid system (`v-container`, `v-row`, `v-col`) for layouts
- Custom theme: `cidadeTema` (amber/brown) defined in `app/plugins/vuetify.ts`

### 5. Component Patterns

```vue
<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface Props {
  itemId?: string
  title?: string
}
const props = withDefaults(defineProps<Props>(), {
  itemId: '',
  title: 'Título Padrão',
})

const emit = defineEmits<{
  save: [data: FormData]
  cancel: []
}>()
</script>
```

### 6. Composable Patterns

```typescript
export function useExample() {
  const { getAuthClient } = useAuth()
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const fetchData = async (query = {}) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(readItems('collection', query))
    }
    catch (e) {
      error.value = e as Error
      throw e
    }
    finally {
      loading.value = false
    }
  }

  return { loading, error, fetchData }
}
```

## Quality Gate

Before marking any change complete:

```bash
bun run typecheck  # Zero TypeScript errors
bun run lint       # Zero ESLint errors
```

## Domain Collections

**Parish Management:** `catolico`, `dizimista`, `pagamento_dizimo`, `oferta_financeira`, `receitas`, `agenda`, `instituicao`

**PDV:** `pdv_products`, `pdv_sales`, `pdv_sale_items`, `pdv_categories`, `pdv_production_points`, `pdv_operators`, `pdv_expenses`, `pdv_schedules`

**Ads:** `ads_novenario`, `ads_log`

## References

- `.github/INTELLIGENCE.md` — Complete engineering guide
- `.github/instructions/*.md` — Context-specific patterns
- `GUIDE.md` — Architecture overview
- `README.md` — Project overview
- `app/types/schema.ts` — Directus schema types
