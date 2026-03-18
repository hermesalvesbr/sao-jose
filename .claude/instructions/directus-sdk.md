---
name: directus-sdk
description: Padrões de uso do Directus SDK no projeto São José
globs: ["app/**/*.ts", "server/**/*.ts"]
order: 4
---

# Directus SDK — São José

## 🔌 MCP — Consulte Antes de Codar

```bash
mcporter list directus-cms-capela-sao-jose --schema
```

## Typed SDK Operations

```typescript
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
await client.request(updateItem('pdv_products', id, { stock_quantity: 100 }))

// Delete
await client.request(deleteItem('pdv_products', id))
```

## Filtering (Database Level)

```typescript
// ✅ Filtro no banco
const products = await client.request(readItems('pdv_products', {
  filter: {
    stock_quantity: { _lte: 5 },
    status: { _eq: 'published' },
  },
  limit: 20,
  sort: ['name'],
}))

// ❌ Filtro no client (NÃO FAÇA)
const products = await client.request(readItems('pdv_products'))
const lowStock = products.filter(p => p.stock_quantity <= 5)
```

## Aggregations

```typescript
const stats = await client.request(readItems('pdv_sales', {
  aggregate: {
    count: '*',
    sum: 'total_amount',
  },
  filter: {
    sale_status: { _eq: 'completed' },
    date_created: { _gte: '2025-01-01' },
  },
}))

const total = Number(stats[0]?.count) || 0
const revenue = Number(stats[0]?.sum?.total_amount) || 0
```

## Avoid N+1 Queries

```typescript
// ✅ Buscar relações em uma query
const sales = await client.request(readItems('pdv_sales', {
  fields: ['id', 'total_amount', 'operator_id.id', 'operator_id.name'],
}))

// ❌ N+1 (NÃO FAÇA)
for (const sale of sales) {
  const operator = await fetchOperator(sale.operator_id)
}
```

## Complex Filters

```typescript
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
```
