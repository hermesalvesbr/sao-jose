# Copilot Instructions for AI Agents

## Core Commands
- **Build:** `bun run build` or `npm run build` (Nuxt build)
- **Dev:** `bun run dev` or `npm run dev` (Nuxt dev server)
- **Generate:** `bun run generate` or `npm run generate` (Static site generation)
- **Preview:** `bun run preview` or `npm run preview` (Preview production build)
- **Type Generation:** `bun run gen:types` (Runs `scripts/genTypes.ts`)
- **Lint:** Project uses ESLint with Antfu config; run lint via your editor or custom script if present (no direct script found).

## High-Level Architecture
- **Frontend:** Nuxt 3 (TypeScript, Composition API, `<script setup lang="ts">`), Vuetify 3 for UI.
- **Backend:** Directus 11 (headless CMS, external API).
- **Structure:**
  - `app/` — main app code (components, pages, layouts, composables, plugins, utils)
  - `server/` — backend/serverless API endpoints
  - `types/` — domain types/interfaces
  - `scripts/` — utility scripts (e.g., type generation)
- **Data Store:** Directus (external, via `@directus/sdk`)
- **No explicit test, migration, or docs scripts found.**

## Style & Coding Rules
- **Vue:**
  - Always use `<script setup lang="ts">` (Composition API only; Options API forbidden)
  - Components in PascalCase; props in camelCase; events in kebab-case
  - Composables must start with `use`
  - No manual imports for auto-imported components/composables/plugins/utils/stores
  - JSDoc comments in English for public APIs
  - Small, focused, reusable components
  - Use Vuetify grid/classes; avoid inline styles
- **TypeScript:**
  - Strong typing everywhere; avoid `any`/`unknown`
  - Use interfaces/types for complex data
  - Enums for constants; generics when needed
- **Architecture:**
  - Clean Architecture: clear separation (Presentation, Application, Domain, Infrastructure)
  - Domain layer (`types/`) is independent; outer layers depend inward
  - Use dependency injection and interfaces for loose coupling
- **Formatting/Lint:**
  - ESLint with `@antfu/eslint-config` (see `eslint.config.js`)
  - Editor should auto-format on save
- **Naming:**
  - Files/components: PascalCase
  - Composables: `useXxx`
  - Plugins: `defineNuxtPlugin`

## Agent/Automation Rules
- Follow all rules in `.cursor/rules/*.mdc` and `GUIDE.md` (see above)
- Never use Options API or manual imports for auto-imported modules
- Always keep codebase ready for Nuxt 4 upgrade
- Document new public functions/components with JSDoc (in English)
- Respect modular structure under `app/`

## Docs & References
- See `README.md` and `GUIDE.md` for project context, goals, and structure
- For new features, follow Clean Architecture and modularity
- For UI, use Vuetify and follow theme/config in `app/plugins/vuetify.ts`

---

For more, see: https://aka.ms/vscode-instructions-docs
