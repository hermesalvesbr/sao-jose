---
name: sao-jose-project
description: Instruções principais do projeto Capela São José - Nuxt 4 + Vuetify 4 + Directus
globs: ["**/*.ts", "**/*.vue", "**/*.md"]
order: 1
---

# Capela São José — Projeto Instructions

## Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| Frontend | Nuxt 4 + Vue 3 + Vuetify 4 + TypeScript |
| Backend/CMS | Directus 11 (PostgreSQL) |
| Package Manager | Bun |
| SDK | @directus/sdk |

## 🔌 MCP Directus — Fonte da Verdade (OBRIGATÓRIO)

**ANTES de gerar código que envolve dados, SEMPRE consulte o MCP:**

```bash
# Listar collections e schemas
mcporter list directus-cms-capela-sao-jose --schema

# Consultar dados específicos
mcporter call directus-cms-capela-sao-jose.items action=read collection=<collection>
```

**Nunca assuma estrutura de collection** — verifique via MCP:
- Campos existentes, tipos de dados, relacionamentos, constraints

### Comandos MCP Disponíveis

```bash
# Softagon (dev/staging)
mcporter list directus-cms-softagon-app --schema

# Capela São José (prod)
mcporter list directus-cms-capela-sao-jose --schema
mcporter call directus-cms-capela-sao-jose.system-prompt
mcporter call directus-cms-capela-sao-jose.items action=read collection=dizimos
mcporter call directus-cms-capela-sao-jose.items action=read collection=oferta_financeira
mcporter call directus-cms-capela-sao-jose.items action=read collection=pdv_sales
```

## Quality Gate (Obrigatório)

Zero erros TypeScript e ESLint. Antes de finalizar:

```bash
bun run typecheck  # Zero erros TypeScript
bun run lint       # Zero erros ESLint
```

## Regras Fundamentais

### 1. TypeScript Strict
- Zero `any` quando tipagem concreta disponível
- Use tipos de `app/types/schema.ts` (ApiCollections)

### 2. Vue 3 Composition API Only
- `<script setup lang="ts">` sempre
- Options API proibida

### 3. Nuxt 4 Auto-imports
- Nunca importe manualmente: `ref`, `computed`, `watch`, `onMounted`, `useRoute`, `useRouter`, `definePageMeta`, `useHead`
- Use diretamente

### 4. DRY — Reutilize Composables Existentes

| Composable | Responsabilidade |
|------------|------------------|
| `useAuth` | Autenticação, clients Directus |
| `useDirectusClient` | Factory de clients |
| `usePdv` | CRUD PDV |
| `usePdvReport` | Utilitários relatório |
| `useAgenda` | Agenda/eventos |
| `useAniversariantes` | Aniversariantes |
| `useDizimos` | Dízimos |
| `useOfertas` | Ofertório |

### 5. Directus SDK
- Use `readItems`, `createItem`, `updateItem`, `deleteItem`, `uploadFiles`
- Filtros no banco, não client-side
- Evite N+1 queries

### 6. Server API (Nuxt 4)
- Arquivos sem sufixo `.get/.post`
- Valide método no handler se necessário

## Referências

- `.github/INTELLIGENCE.md` — Guia completo de padrões
- `app/types/schema.ts` — Tipos Directus
- `GUIDE.md` — Arquitetura
- `README.md` — Visão geral
