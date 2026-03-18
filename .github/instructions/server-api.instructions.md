---
name: Nuxt 4 Server API Rules
description: Regras para handlers em server/api no Nuxt 4
applyTo: "server/api/**/*.ts"
---

# Server API Rules (Nuxt 4)

## File Naming

```typescript
// ✅ CORRETO — Nomes neutros (sem sufixo de método)
server/api/agenda.ts
server/api/aniversariantes.ts
server/api/directus.ts
server/api/pdv/catalog.ts

// ❌ ERRADO — Sufixos de método (Nuxt 3 pattern)
server/api/agenda.get.ts
server/api/aniversariantes.post.ts
```

**Regra:** Em Nuxt 4, não use sufixos `.get.ts`, `.post.ts`, etc. O método é detectado automaticamente via `event.method`.

## Method Validation

```typescript
// Validar método HTTP quando necessário
import { assertMethod } from 'h3'

export default defineEventHandler(async (event) => {
  assertMethod(event, 'GET') // Apenas GET permitido
  // ...
})

// Para múltiplos métodos
export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    // Handle GET
  }
  else if (event.method === 'POST') {
    // Handle POST
    const body = await readBody(event)
  }
})
```

## Directus Server Client

```typescript
// server/api/example.ts
import { createServerDirectusClient } from '~/server/utils/directus'
import { readItems } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  const client = createServerDirectusClient(event)

  // Query tipada
  const data = await client.request(readItems('collection'))

  return {
    success: true,
    data,
  }
})
```

## Security Rules

```typescript
// ✅ CORRETO — Token nunca exposto ao client
export default defineEventHandler(async (event) => {
  const client = createServerDirectusClient(event)
  // Token fica no server
  const data = await client.request(readItems('collection'))
  return { data }
})

// ❌ ERRADO — Expor token ou dados sensíveis
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  return {
    data,
    token: config.directus.token, // NUNCA FAÇA ISSO
  }
})
```

## Runtime Config

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    directus: {
      token: process.env.NUXT_DIRECTUS_TOKEN || '',
    },
    public: {
      directus: {
        url: process.env.NUXT_PUBLIC_DIRECTUS_URL || '',
        token: process.env.NUXT_PUBLIC_DIRECTUS_TOKEN || '',
      },
    },
  },
})

// server/api/example.ts
const config = useRuntimeConfig(event)
const token = config.directus.token // Server-side only
const publicUrl = config.public.directus.url // Also available client-side
```

## Response Format

```typescript
// ✅ Padrão consistente
return {
  success: true,
  data: items,
  meta: {
    total,
    page,
    limit,
  },
}

// Error handling
return {
  success: false,
  error: 'Error message',
  code: 'ERROR_CODE',
}
```

## Error Handling

```typescript
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const client = createServerDirectusClient(event)
    const data = await client.request(readItems('collection'))
    return { success: true, data }
  }
  catch (error) {
    console.error('API Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch data',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})
```

## CORS and Headers

```typescript
export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/json')
  setHeader(event, 'Cache-Control', 'no-store')

  // ...
})
```

## Example: Full API Route

```typescript
// server/api/pdv/sales.ts
import { createServerDirectusClient } from '~/server/utils/directus'
import { readItems } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  // Validate method
  assertMethod(event, 'GET')

  const client = createServerDirectusClient(event)

  // Parse query params
  const query = getQuery(event)
  const dateFrom = query.from as string
  const dateTo = query.to as string

  // Fetch with filter
  const sales = await client.request(readItems('pdv_sales', {
    filter: {
      _and: [
        { sale_status: { _eq: 'completed' } },
        { date_created: { _gte: dateFrom } },
        { date_created: { _lte: dateTo } },
      ],
    },
    fields: ['id', 'total_amount', 'payment_method', 'date_created'],
    sort: ['-date_created'],
    limit: 100,
  }))

  return {
    success: true,
    data: sales,
    meta: {
      total: sales.length,
      dateFrom,
      dateTo,
    },
  }
})
```

## References

- `.github/INTELLIGENCE.md` — Complete patterns guide
- `server/utils/directus.ts` — Server Directus client factory
- `server/api/pdv/` — Example API routes
- [Nuxt 4 Server Routes](https://nuxt.com/docs/guide/directory-structure/server)
- [H3 Documentation](https://h3.unjs.io/)
