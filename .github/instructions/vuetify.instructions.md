---
name: Vuetify 4 UI Rules
description: Regras para construção de UI com Vuetify no projeto
applyTo: "app/**/*.vue"
---

# Vuetify Rules

- Use Vuetify components and layout system as default.
- Follow project theme/defaults from `app/plugins/vuetify.ts`.
- Use existing theme tokens and component defaults; avoid introducing ad-hoc visual styles.
- Prefer responsive behavior with `useDisplay()` for layout switches.
- Keep accessibility in mind for buttons, fields, and dialogs.
- Reuse existing UI patterns before creating new structures (DRY).
