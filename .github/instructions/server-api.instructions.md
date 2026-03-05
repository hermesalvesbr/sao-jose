---
name: Nuxt 4 Server API Rules
description: Regras para handlers em server/api no Nuxt 4
applyTo: "server/api/**/*.ts"
---

# Server API Rules (Nuxt 4)

- In Nuxt 4, do not use method suffixes in filenames (`.get.ts`, `.post.ts`, etc.).
- Use neutral names such as `agenda.ts`, `aniversariantes.ts`, `directus.ts`.
- If method constraints are required, enforce them inside the handler (for example `assertMethod(event, 'GET')`).
- Prefer server-side Directus client from `server/utils/directus.ts`.
- Never expose private runtime token values to the client.
- Keep handler code minimal, typed, and focused.
