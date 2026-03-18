---
name: fix-lint-types
description: Analisa e corrige erros de ESLint e TypeScript no codebase
argument-hint: "Informe escopo (arquivo, pasta ou projeto inteiro)"
agent: agent
---

# Corrigir Erros de Lint e Types

Corrija erros de qualidade no escopo informado com prioridade para mudanças mínimas:

## Processo

1. Rode `bun run lint`.
2. Rode `bun run typecheck`.
3. Corrija apenas erros relacionados ao escopo solicitado.
4. Preserve arquitetura, padrões Nuxt 4 auto-import, DRY e tipagem estrita.
5. Reexecute `bun run lint` e `bun run typecheck` até ficar limpo no escopo.

## Regras

Use as regras de:

- [Copilot Instructions](../copilot-instructions.md)
- [TypeScript Rules](../instructions/typescript.instructions.md)
- [INTELLIGENCE.md](../INTELLIGENCE.md)

## Padrões de Correção

### TypeScript

```typescript
// ❌ Evitar
const data: any = await fetch()

// ✅ Corrigir
const data = await fetchData() // Tipo inferido ou explícito
```

### ESLint

```typescript
// ❌ Import manual de auto-import
import { ref, computed } from 'vue'

// ✅ Usar diretamente (auto-import)
const count = ref(0)
const doubled = computed(() => count.value * 2)
```

Escopo:
${input:scope:ex. app/composables/usePdv.ts}
