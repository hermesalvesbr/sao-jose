---
name: fix-lint-types
description: Analisa e corrige erros de ESLint e TypeScript no codebase
argument-hint: "Informe escopo (arquivo, pasta ou projeto inteiro)"
agent: agent
---

Corrija erros de qualidade no escopo informado com prioridade para mudanças mínimas:

1. Rode `bun run lint`.
2. Rode `bun run typecheck`.
3. Corrija apenas erros relacionados ao escopo solicitado.
4. Preserve arquitetura, padrões Nuxt 4 auto-import, DRY e tipagem estrita.
5. Reexecute `bun run lint` e `bun run typecheck` até ficar limpo no escopo.

Use as regras de:

- [Copilot Instructions](../copilot-instructions.md)
- [TypeScript Rules](../instructions/typescript.instructions.md)

Escopo:
${input:scope:ex. app/composables/usePdv.ts}
