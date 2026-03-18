---
name: create-composable
description: Cria composable tipado e reutilizável com padrão do projeto
argument-hint: "Informe nome do composable e responsabilidade"
agent: agent
---

# Criar Composable

Implemente um composable para este projeto seguindo:

- [Copilot Instructions](../copilot-instructions.md)
- [Composables Standards](../instructions/composables.instructions.md)
- [TypeScript Rules](../instructions/typescript.instructions.md)
- [Directus SDK Rules](../instructions/directus-sdk.instructions.md)
- [INTELLIGENCE.md](../INTELLIGENCE.md)

## 🔌 MCP Directus — Obrigatório

Se o composable acessar dados do Directus, **antes de criar**:

```bash
mcporter list directus-cms-capela-sao-jose --schema
```

Verifique:
- Collection existe e nome correto
- Campos disponíveis e tipos
- Relacionamentos com outras collections

## Checklist Obrigatório

- Nome com prefixo `use`
- Tipagem estrita e sem `any`
- DRY (reutilizar composables existentes)
- Estado `loading`/`error` quando houver async
- Usar cliente Directus correto (`useDirectusClient` ou `useAuth().getAuthClient`)
- Entregar sem erro de lint/typecheck

## Estrutura Esperada

```typescript
import type { PdvProduct } from '~/types/schema'
import { readItems } from '@directus/sdk'

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

  return {
    loading,
    error,
    fetchData,
  }
}
```

Contexto do pedido:
${input:task:Descreva o composable desejado}
