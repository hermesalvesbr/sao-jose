---
name: Vue Components (Nuxt 4)
description: Regras para componentes e páginas Vue com script setup + Vuetify
applyTo: "app/**/*.vue"
---

# Vue Components Rules

- Use `<script setup lang="ts">` only.
- Never use Options API.
- Never manually import Nuxt/Vue auto-imports (`ref`, `computed`, `watch`, `onMounted`, `useRoute`, `useRouter`, `definePageMeta`, `useHead`, `useSeoMeta`, etc.).
- Keep UI logic in components and business logic in composables.
- Reuse existing components/composables before creating new ones (DRY).
- Use Vuetify layout and theme primitives only.
- Use explicit typing for props/emits (`defineProps<T>()`, `defineEmits<T>()`).
- Avoid inline styles unless there is no existing utility/class alternative.
- Prefer computed values over repeated template expressions.
