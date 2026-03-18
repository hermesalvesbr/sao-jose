---
name: TypeScript Strict Rules
description: Regras de tipagem estrita para arquivos TypeScript
applyTo: "**/*.ts"
---

# TypeScript Rules

## Tolerância ZERO

- Deliver strict TypeScript with zero errors.
- Zero `any` when concrete typing is available.
- Zero `unknown` when specific types are available.
- Run `bun run typecheck` before finishing any implementation.

## Directus Schema Types

```typescript
// ✅ CORRETO — Usar tipos do schema
import type { ApiCollections, PdvProduct, PdvSale } from '~/types/schema'

const products = ref<PdvProduct[]>([])
const sale = ref<PdvSale | null>(null)

// Query tipada com ApiCollections
import type { readItems } from '@directus/sdk'
await client.request(readItems<ApiCollections['pdv_products']>('pdv_products'))
```

## Function Return Types

```typescript
// ✅ CORRETO — Retorno explícito para funções públicas
export async function fetchProducts(): Promise<PdvProduct[]> {
  // ...
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// ✅ OK — Inferido para funções privadas/locals simples
const doubled = (n: number) => n * 2
```

## Relation Fields

```typescript
// ✅ CORRETO — Relações como union (string | RelatedEntity)
interface PdvSale {
  id: string
  operator_id: string | PdvOperator // Pode vir como ID ou objeto relacionado
  sale_status: string
}

// Manuseio seguro
const operatorName = typeof sale.operator_id === 'object'
  ? sale.operator_id.name
  : sale.operator_id // Fallback para ID se necessário
```

## Generic Types

```typescript
// ✅ CORRETO — Generics com constraints
function findById<T extends { id: string | number }>(items: T[], id: string | number): T | undefined {
  return items.find(item => item.id === id)
}

// ✅ CORRETO — Type parameters
type ApiResponse<T> = {
  success: boolean
  data: T | null
  error?: string
}
```

## Utility Types

```typescript
// Reuse tipos utilitários do TypeScript
type ProductCreate = Omit<PdvProduct, 'id' | 'date_created' | 'user_created'>
type ProductUpdate = Partial<ProductCreate>
type ProductSummary = Pick<PdvProduct, 'id' | 'name' | 'price'>

// Mapped types
type ReadonlyProducts = {
  readonly [K in keyof PdvProduct]: PdvProduct[K]
}
```

## Type Guards

```typescript
// ✅ CORRETO — Type guards para relações
function isPdvOperator(obj: string | PdvOperator): obj is PdvOperator {
  return typeof obj === 'object' && obj !== null
}

// Uso
if (isPdvOperator(sale.operator_id)) {
  console.log(sale.operator_id.name) // Tipado como PdvOperator
}
```

## DRY com Tipos

- Reuse existing utility types from `app/types/schema.ts`.
- Prefer `Partial<T>`, `Pick<T, K>`, `Omit<T, K>` over creating new types.
- Create specific types only when they add clarity or safety.

## Avoiding Any

```typescript
// ❌ NUNCA FAÇA
const data: any = await fetch()
function handleEvent(event: any) { }

// ✅ FAÇA
const data = await fetchData() // Tipo inferido
interface ApiError {
  message: string
  code: string
}
function handleEvent(event: { type: string, payload: unknown }) { }

// ✅ Para dados externos não confiáveis
function parseJson(input: string): unknown {
  return JSON.parse(input)
}

// Type assertion após validação
function parseProduct(input: unknown): PdvProduct {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Invalid product')
  }
  // Validação e cast seguros
  return input as PdvProduct
}
```

## Referências

- `.github/INTELLIGENCE.md` — Guia completo de padrões
- `app/types/schema.ts` — Tipos gerados do Directus
- `app/types/api.ts` — Tipos de API
