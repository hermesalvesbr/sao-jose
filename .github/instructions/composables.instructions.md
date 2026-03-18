---
name: Composables Standards
description: Padrões para composables, estado reativo e integração de dados
applyTo: "app/composables/**/*.ts"
---

# Composables Rules

## Estrutura Básica

```typescript
export function useExample() {
  const { getAuthClient } = useAuth() // Reuse auth existente
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
      throw e // Permite caller handle error
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchData,
  }
}
```

## Regras

- Composable names must start with `use`.
- Keep composables focused and reusable.
- Follow DRY: check existing composables before introducing new ones.
- Prefer `ref` + `computed` state with explicit types.
- Use `useState` when state must be SSR-friendly/shared in Nuxt.
- For async flows, keep `loading` and `error` state and use `try/finally`.

## Directus Client Patterns

### Client Autenticado (Usuário Logado)

```typescript
const { getAuthClient } = useAuth()
const client = await getAuthClient()
// Usa autoRefresh + localStorage persistence
```

### Client Estático (Páginas Públicas)

```typescript
const { public: { directus: { token } } } = useRuntimeConfig()
const { getStaticClient } = useAuth()
const client = getStaticClient(token)
```

### Server Client (Nunca Expõe Token)

```typescript
// server/api/example.ts
import { createServerDirectusClient } from '~/server/utils/directus'

export default defineEventHandler(async (event) => {
  const client = createServerDirectusClient(event)
  // ...
})
```

## Error Handling

```typescript
// ✅ CORRETO — Propaga erro para caller
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

// ❌ ERRADO — Silencia erro
try {
  const data = await fetchData()
  return data
}
catch (e) {
  console.error(e) // Error swallowed
  return null
}
```

## Retry Pattern

Para operações que podem falhar temporariamente:

```typescript
async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    }
    catch (error) {
      lastError = error as Error
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
      }
    }
  }

  throw new Error(`Operação falhou após ${maxRetries} tentativas: ${lastError?.message}`)
}
```

## Type Safety

```typescript
// ✅ CORRETO — Tipos explícitos
import type { PdvProduct } from '~/types/schema'

const products = ref<PdvProduct[]>([])
const fetchProducts = async (): Promise<PdvProduct[]> => {
  // ...
}

// ❌ ERRADO — any broad
const products = ref<any[]>([])
const fetchProducts = async () => {
  // ...
}
```

## DRY Checklist

Antes de criar novo composable:

1. [ ] Verifiquei `useAuth` para autenticação?
2. [ ] Verifiquei `useDirectusClient` para client factory?
3. [ ] Verifiquei `usePdv` para operações PDV?
4. [ ] Verifiquei `usePdvReport` para utilitários de relatório?
5. [ ] Verifiquei `useDizimos`, `useOfertas`, `useAgenda` para domínio específico?
6. [ ] Posso extrair para função utilitária em vez de novo composable?

## Referências

- `.github/INTELLIGENCE.md` — Guia completo de padrões
- `app/composables/useAuth.ts` — Padrão de autenticação
- `app/composables/useDirectusClient.ts` — Padrão de client factory
- `app/composables/usePdv.ts` — Padrão de composable CRUD
