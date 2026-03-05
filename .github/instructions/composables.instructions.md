---
name: Composables Standards
description: Padrões para composables, estado reativo e integração de dados
applyTo: "app/composables/**/*.ts"
---

# Composables Rules

- Composable names must start with `use`.
- Keep composables focused and reusable.
- Follow DRY: check existing composables before introducing new ones.
- Prefer `ref` + `computed` state with explicit types.
- Use `useState` when state must be SSR-friendly/shared in Nuxt.
- For async flows, keep `loading` and `error` state and use `try/finally`.
- Use `useDirectusClient()` for static-token data reads and `useAuth().getAuthClient()` for authenticated operations.
- Do not instantiate duplicate Directus clients if an existing composable already provides one.
- Avoid `any`; use schema types from `app/types/schema.ts`.
