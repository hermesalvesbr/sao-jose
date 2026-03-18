---
name: composables
description: Padrões para composables no projeto São José
globs: ["app/composables/**/*.ts"]
order: 3
---

# Composables — São José

## Estrutura Padrão

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

## Regras

1. Nome sempre começa com `use`
2. Estado explícito: `loading`, `error`, `data`
3. Use `try/finally` para cleanup do loading
4. Reuse `useAuth().getAuthClient()` — não crie novo client

## Directus Client Patterns

### Autenticado
```typescript
const { getAuthClient } = useAuth()
const client = await getAuthClient()
```

### Estático (páginas públicas)
```typescript
const { public: { directus: { token } } } = useRuntimeConfig()
const { getStaticClient } = useAuth()
const client = getStaticClient(token)
```

### Server
```typescript
// server/utils/directus.ts
const client = createServerDirectusClient(event)
```

## Error Handling

```typescript
// ✅ Propaga erro para caller
try {
  const data = await fetchData()
  return data
}
catch (e) {
  error.value = e as Error
  throw e // Caller decide como handle
}
finally {
  loading.value = false
}
```

## Type Safety

```typescript
import type { PdvProduct } from '~/types/schema'

const products = ref<PdvProduct[]>([])
const fetchProducts = async (): Promise<PdvProduct[]> => { /* ... */ }
```
