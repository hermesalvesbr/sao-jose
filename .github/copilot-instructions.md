# Copilot Instructions for São José (Nuxt 4)

## Stack and Runtime

- Frontend: Nuxt 4 (`^4.3.1`), Vue 3 (`^3.5.x`), Vuetify 4 (`^4.0.x`)
- Backend API: Nuxt server routes + Directus 11 via `@directus/sdk`
- Runtime: Bun
- Type safety: TypeScript strict via Nuxt typecheck
- Lint/format: ESLint (`@antfu/eslint-config`) with formatter rules, no Prettier

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

- Follow DRY strictly: do not duplicate existing logic.
- Before creating new composables/helpers, check and reuse:
  - `useAuth`, `useDirectusClient`, `usePdv`, `usePdvReport`
  - `useAgenda`, `useAniversariantes`, `useDizimos`, `useOfertas`, `usePublicSeo`
- Extract repeated transformations/formatters into reusable functions.

## Directus Integration Rules

- Prefer typed SDK calls: `readItems`, `createItem`, `updateItem`, `deleteItem`, `uploadFiles`.
- Avoid raw `fetch('/items/...')` for Directus data access.
- Use typed schema generics from `ApiCollections`.
- Keep token security: token never exposed to client.

## Server API Conventions (Nuxt 4)

- In `server/api`, do not use method suffixes in filenames (`.get.ts`, `.post.ts`, etc.).
- Use neutral route filenames (`agenda.ts`, `aniversariantes.ts`, `directus.ts`).
- If route should enforce HTTP method, validate inside handler (`assertMethod(event, 'GET')`).

## Vuetify Rules

- Use Vuetify components and grid system (`v-container`, `v-row`, `v-col`) instead of ad-hoc layout code.
- Use project themes and defaults from `app/plugins/vuetify.ts`.
- Prefer responsive behavior through `useDisplay()` when needed.

## Naming and Patterns

- Components/files: PascalCase.
- Composables: `useXxx`.
- Plugins: `defineNuxtPlugin`.
- Keep code explicit, strongly typed, and readable.

## References

- `GUIDE.md`
- `README.md`
- `app/types/schema.ts`
- `app/plugins/vuetify.ts`
- `nuxt.config.ts`
