---
name: Directus SDK Integration
description: Boas práticas para acesso de dados no Directus via SDK
---

# Directus SDK Rules

- Use `@directus/sdk` typed operations (`readItems`, `createItem`, `updateItem`, `deleteItem`, `uploadFiles`).
- Always align access with `ApiCollections` types.
- Avoid untyped raw Directus requests when typed SDK helpers are available.
- Keep filtering/pagination in the query layer (DB-side), not only client-side.
- Avoid N+1 queries by selecting required relations in one request when possible.
- Reuse existing data-access composables before adding new patterns (DRY).
