---
name: typescript
description: Padrões TypeScript no projeto São José
globs: ["**/*.ts"]
order: 5
---

# TypeScript — São José

## Tolerância ZERO

- Zero erros TypeScript no build
- Zero `any` quando tipagem concreta disponível
- Zero `unknown` quando tipo específico disponível

## Directus Schema Types

```typescript
// ✅ Use tipos do schema
import type { ApiCollections, PdvProduct, PdvSale } from '~/types/schema'

const products = ref<PdvProduct[]>([])
const sale = ref<PdvSale | null>(null)
```

## Function Return Types

```typescript
// ✅ Retorno explícito para funções públicas
export async function fetchProducts(): Promise<PdvProduct[]> { }
export function formatCurrency(value: number): string { }

// ✅ Inferido para funções privadas simples
const doubled = (n: number) => n * 2
```

## Relation Fields

```typescript
// Relações como union
interface PdvSale {
  operator_id: string | PdvOperator
}

// Manuseio seguro
const operatorName = typeof sale.operator_id === 'object'
  ? sale.operator_id.name
  : sale.operator_id
```

## Type Guards

```typescript
function isPdvOperator(obj: string | PdvOperator): obj is PdvOperator {
  return typeof obj === 'object' && obj !== null
}

// Uso
if (isPdvOperator(sale.operator_id)) {
  console.log(sale.operator_id.name) // Tipado como PdvOperator
}
```

## Utility Types

```typescript
type ProductCreate = Omit<PdvProduct, 'id' | 'date_created' | 'user_created'>
type ProductUpdate = Partial<ProductCreate>
type ProductSummary = Pick<PdvProduct, 'id' | 'name' | 'price'>
```

## Avoid Any

```typescript
// ❌ NUNCA
const data: any = await fetch()

// ✅ FAÇA
const data = await fetchData() // Tipo inferido

// ✅ Para dados externos
function parseJson(input: string): unknown {
  return JSON.parse(input)
}
```
