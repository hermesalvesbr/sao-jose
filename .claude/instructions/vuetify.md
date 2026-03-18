---
name: vuetify
description: Padrões Vuetify 4 no projeto São José
globs: ["app/**/*.vue"]
order: 6
---

# Vuetify 4 — São José

## Fundamentos

- Use grid system: `v-container`, `v-row`, `v-col`
- Use classes utilitárias: `pa-4`, `me-2`, `d-flex`, `text-h5`
- Use tokens do tema: `primary`, `secondary`, `error`
- Nunca cores hex inline: `#1976D2` ❌

## Classes Utilitárias

```vue
<!-- Espaçamento -->
<div class="pa-4 ma-2">
<div class="mt-4 mb-2">

<!-- Flexbox -->
<div class="d-flex align-center justify-space-between">
<div class="flex-column flex-sm-row">

<!-- Tipografia -->
<h1 class="text-h4 font-weight-bold">
<p class="text-body-2 text-medium-emphasis">

<!-- Cores -->
<div class="text-primary">
<div class="bg-surface-variant">
```

## Responsivo

```vue
<!-- Mobile: coluna, Desktop: linha -->
<div class="flex-column flex-sm-row">

<!-- Esconder em mobile -->
<div class="d-none d-sm-flex">

<!-- Grid responsivo -->
<v-col cols="12" sm="6" md="4">
```

## Proibições Vuetify 4

```vue
<!-- ❌ NUNCA USE -->
<v-row dense />
<v-list-item active-color="primary" />
<v-data-table dense />
<v-number-input />

<!-- ✅ CORRETO -->
<v-row class="ga-2" />
<v-list-item color="primary" />
<v-data-table density="compact" />
<!-- Use v-list + botões para contador -->
```

## Print Layout

```vue
<!-- Não imprimir -->
<div class="d-print-none">

<!-- Só imprimir -->
<div class="d-none d-print-block">
```
