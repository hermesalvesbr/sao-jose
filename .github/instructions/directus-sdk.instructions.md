---
name: Directus SDK Integration
description: Boas práticas para acesso de dados no Directus via SDK
---

# Directus SDK Rules

## 🔌 MCP Directus — Fonte da Verdade

**ANTES de escrever qualquer query Directus:**

```bash
# Consultar schema das collections
mcporter list directus-cms-capela-sao-jose --schema

# Consultar dados específicos
mcporter call directus-cms-capela-sao-jose.items action=read collection=<collection>
```

Nunca assuma estrutura de collection — sempre verifique:
- Campos existentes
- Tipos de dados
- Relacionamentos
- Constraints

## Typed SDK Operations

```typescript
// ✅ CORRETO — SDK tipado
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { ApiCollections, PdvProduct } from '~/types/schema'

const client = await getAuthClient()

// Read
const products = await client.request(readItems<PdvProduct>('pdv_products'))

// Create
const newProduct = await client.request(createItem('pdv_products', {
  name: 'Produto',
  price: 10.99,
}))

// Update
await client.request(updateItem('pdv_products', id, {
  stock_quantity: 100,
}))

// Delete
await client.request(deleteItem('pdv_products', id))

// Upload files
import { uploadFiles } from '@directus/sdk'
const formData = new FormData()
formData.append('file', file)
const result = await client.request(uploadFiles(formData))
```

## Query Filtering (Database Level)

```typescript
// ✅ CORRETO — Filtro no banco
const products = await client.request(readItems('pdv_products', {
  filter: {
    stock_quantity: { _lte: 5 }, // Estoque baixo
    status: { _eq: 'published' },
  },
  limit: 20,
  sort: ['name'],
}))

// ❌ ERRADO — Filtro no client
const products = await client.request(readItems('pdv_products'))
const lowStock = products.filter(p => p.stock_quantity <= 5)
```

## Aggregations

```typescript
// ✅ CORRETO — Agregação no banco
const salesStats = await client.request(readItems('pdv_sales', {
  aggregate: {
    count: '*', // Total de vendas
    sum: 'total_amount', // Soma dos valores
    avg: 'total_amount', // Ticket médio
  },
  filter: {
    sale_status: { _eq: 'completed' },
    date_created: { _gte: '2025-01-01' },
  },
}))

const totalCount = Number(salesStats[0]?.count) || 0
const totalRevenue = Number(salesStats[0]?.sum?.total_amount) || 0
```

## Avoiding N+1 Queries

```typescript
// ✅ CORRETO — Buscar relações em uma query
const sales = await client.request(readItems('pdv_sales', {
  fields: [
    'id',
    'total_amount',
    'operator_id.id',
    'operator_id.name',
    'sale_items.id',
    'sale_items.product_id',
    'sale_items.quantity',
  ],
}))

// ❌ ERRADO — Query por operador para cada venda
for (const sale of sales) {
  const operator = await client.request(readItems('pdv_operators', {
    filter: { id: { _eq: sale.operator_id } },
  }))
}
```

## Field Selection

```typescript
// ✅ CORRETO — Selecionar apenas campos necessários
const products = await client.request(readItems('pdv_products', {
  fields: ['id', 'name', 'price', 'stock_quantity'],
}))

// ✅ Para relações
const sales = await client.request(readItems('pdv_sales', {
  fields: [
    'id',
    'total_amount',
    'operator_id.name', // Relação one-to-many
  ],
}))
```

## Complex Filters

```typescript
// AND/OR filters
const filter = {
  _and: [
    { sale_status: { _eq: 'completed' } },
    {
      _or: [
        { payment_method: { _eq: 'dinheiro' } },
        { payment_method: { _eq: 'pix' } },
      ],
    },
  ],
}

// Date ranges
const dateFilter = {
  date_created: {
    _gte: dayStartBRT(dateFrom.value),
    _lte: dayEndBRT(dateTo.value),
  },
}
```

## Client Types

### Authenticated Client (User Logged In)

```typescript
const { getAuthClient } = useAuth()
const client = await getAuthClient()
// Auto-refresh enabled, localStorage persistence
```

### Static Token Client (Public Pages)

```typescript
const { public: { directus: { token } } } = useRuntimeConfig()
const { getStaticClient } = useAuth()
const client = getStaticClient(token)
```

### Server Client (Token Never Exposed)

```typescript
// server/utils/directus.ts
export function createServerDirectusClient(event: H3Event) {
  const config = useRuntimeConfig(event)
  return createDirectus<ApiCollections>(config.public.directus.url)
    .with(staticToken(config.directus.token))
    .with(rest())
}
```

## Error Handling

```typescript
async function fetchProducts() {
  const client = await getAuthClient()
  try {
    return await client.request(readItems('pdv_products'))
  }
  catch (error) {
    console.error('Failed to fetch products:', error)
    throw error // Propagate para caller handle
  }
}
```

## DRY Checklist

Before creating new data access code:

1. [ ] Check `usePdv` for existing PDV operations
2. [ ] Check `useDizimos` for tithe-related data
3. [ ] Check `useOfertas` for offering data
4. [ ] Check `useAgenda` for agenda/events
5. [ ] Check if composable already exists for this collection
6. [ ] Use existing client factories (`getAuthClient`, `getStaticClient`)

## References

- `.github/INTELLIGENCE.md` — Complete patterns guide
- `app/types/schema.ts` — Generated Directus types
- `app/composables/usePdv.ts` — Example composable with SDK
- `app/composables/useAuth.ts` — Client authentication patterns
- `app/composables/useDirectusClient.ts` — Client factory patterns
