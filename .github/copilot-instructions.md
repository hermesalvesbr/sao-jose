# Copilot Instructions for São José (Nuxt 4)

## Stack and Runtime

- Frontend: Nuxt 4 (`^4.3.1`), Vue 3 (`^3.5.x`), Vuetify 4 (`^4.0.x`)
- Backend API: Nuxt server routes + Directus 11 via `@directus/sdk`
- Runtime: Bun
- Type safety: TypeScript strict via Nuxt typecheck
- Lint/format: ESLint (`@antfu/eslint-config`) with formatter rules, no Prettier

## 🔌 MCP Directus — Source of Truth (MANDATORY)

**BEFORE generating any data-related code, consult the MCP:**

```bash
# List collections and schemas
mcporter list directus-cms-capela-sao-jose --schema

# Query specific data
mcporter call directus-cms-capela-sao-jose.items action=read collection=<collection_name>
```

**Never assume collection structure** — always verify via MCP:
- Existing fields
- Data types
- Relationships
- Constraints

### Available MCP Commands

```bash
# Softagon environment
mcporter list directus-cms-softagon-app --schema

# Capela São José environment (production)
mcporter list directus-cms-capela-sao-jose --schema
mcporter call directus-cms-capela-sao-jose.system-prompt
mcporter call directus-cms-capela-sao-jose.items action=read collection=dizimos
mcporter call directus-cms-capela-sao-jose.items action=read collection=oferta_financeira
mcporter call directus-cms-capela-sao-jose.items action=read collection=pdv_sales
```

## Quality Gate (Mandatory)

- Always deliver code with **zero new ESLint errors** and **zero TypeScript errors**.
- Before finishing implementation, run:
  - `bun run lint`
  - `bun run typecheck`
- If there are errors caused by the new change, fix them before returning.

## Core Commands

- Dev: `bun run dev`
- Build: `bun run build`
- Generate static: `bun run generate`
- Preview: `bun run preview`
- Type generation (Directus): `bun run gen:types`

## Architecture and Boundaries

- Use `<script setup lang="ts">` only. Options API is forbidden.
- Keep business logic in composables/services, not in page templates.
- Prefer small and reusable components.
- Keep domain typing centered in `app/types/schema.ts` (`ApiCollections`).

## Nuxt 4 Auto-import Rules (Mandatory)

- Never manually import Nuxt/Vue auto-imported utilities in app code.
- Rely on auto-imports for items like:
  - `ref`, `computed`, `watch`, `watchEffect`, `onMounted`
  - `useRoute`, `useRouter`, `navigateTo`
  - `definePageMeta`, `useHead`, `useSeoMeta`
  - `useRuntimeConfig`, `useState`, `$fetch`
  - Project composables in `app/composables/*`

## DRY Rules (Mandatory)

- Follow DRY strict: do not duplicate existing logic.
- Before creating new composables/helpers, check and reuse:
  - `useAuth`, `useDirectusClient`, `usePdv`, `usePdvReport`
  - `useAgenda`, `useAniversariantes`, `useDizimos`, `useOfertas`, `usePublicSeo`
- Extract repeated transformations/formatters into reusable functions.

## Directus Integration Rules

- Prefer typed SDK calls: `readItems`, `createItem`, `updateItem`, `deleteItem`, `uploadFiles`.
- Avoid raw `fetch('/items/...')` for Directus data access.
- Use typed schema generics from `ApiCollections`.
- Keep token security: token never exposed to client.
- Use aggregations at database level instead of client-side processing.
- Avoid N+1 queries — fetch relations in a single call.

## Server API Conventions (Nuxt 4)

- In `server/api`, do not use method suffixes in filenames (`.get.ts`, `.post.ts`, etc.).
- Use neutral route filenames (`agenda.ts`, `aniversariantes.ts`, `directus.ts`).
- If route should enforce HTTP method, validate inside handler (`assertMethod(event, 'GET')`).
- Use `createServerDirectusClient(event)` for secure server-side access.

## Vuetify Rules

- Use Vuetify components and grid system (`v-container`, `v-row`, `v-col`) instead of ad-hoc layout code.
- Use project themes and defaults from `app/plugins/vuetify.ts`.
- Prefer responsive behavior through `useDisplay()` when needed.
- Use theme tokens (`primary`, `secondary`, `error`) — never inline hex colors.

## Naming and Patterns

- Components/files: PascalCase.
- Composables: `useXxx`.
- Plugins: `defineNuxtPlugin`.
- Keep code explicit, strongly typed, and readable.

## Pattern Reference by Context

| Context | File to Consult |
|---------|-----------------|
| Vue Components | `.github/instructions/vue-components.instructions.md` |
| Composables | `.github/instructions/composables.instructions.md` |
| TypeScript | `.github/instructions/typescript.instructions.md` |
| Directus SDK | `.github/instructions/directus-sdk.instructions.md` |
| Server API | `.github/instructions/server-api.instructions.md` |
| Vuetify UI | `.github/instructions/vuetify.instructions.md` |

## Full Documentation

For comprehensive patterns and examples, consult:
- `.github/INTELLIGENCE.md` — Complete code generation intelligence guide
- `GUIDE.md` — Architecture guide
- `README.md` — Project overview
- `app/types/schema.ts` — Directus schema types
- `nuxt.config.ts` — Nuxt configuration
