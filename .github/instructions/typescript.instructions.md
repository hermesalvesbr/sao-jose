---
name: TypeScript Strict Rules
description: Regras de tipagem estrita para arquivos TypeScript
applyTo: "**/*.ts"
---

# TypeScript Rules

- Deliver strict TypeScript with zero errors.
- Avoid `any` and avoid broad `unknown` when concrete typing is available.
- Use interfaces/types from `app/types/schema.ts` (`ApiCollections`) for Directus entities.
- Prefer explicit function return types for public functions.
- Keep relation fields aligned with existing schema unions (`string | RelatedEntity`).
- Reuse existing utility types and helpers before creating new ones (DRY).
