---
description: "Cursor Rules para projeto Nuxt 3 + Vuetify seguindo Clean Architecture"
globs:
  - "**/*.ts"
  - "**/*.vue"
  - "**/*.md"
tags:
  - nuxt
  - vuetify
  - typescript
  - clean-architecture
priority: 1
version: "1.0.0"
---

## 🧐 Contexto

Projeto baseado em Nuxt 3.17+ compatível com Nuxt 4, utilizando Vuetify 3.8.2 como biblioteca de componentes UI. Todo código é escrito em TypeScript com Composition API (`<script setup lang="ts">`), seguindo Clean Architecture.

## ✅ Requisitos Essenciais

- Sempre usar `<script setup lang="ts">`.
- Composition API obrigatória (Options API proibida).
- Componentes nomeados combinando Pasta+Arquivo.
  - Ex: `components/form/Input.vue` -> `<FormInput />`
- Evitar import manual para componentes autoimportados, composables, plugins, utils e stores.
- Funções composables devem ter prefixo `use`.
- Comentários em inglês, formato JSDoc.
- Respeitar Clean Architecture.

## 🔧 Estrutura Padrão

```text
app/
├─ components/
│   ├─ form/
│   │   └─ Input.vue → <FormInput />
│   ├─ layout/
│   │   └─ Header.vue → <LayoutHeader />
├─ composables/
│   └─ useAuth.ts
├─ layouts/
│   └─ default.vue
├─ middleware/
├─ pages/
│   ├─ index.vue
│   ├─ about.vue
├─ plugins/
│   └─ vuetify.ts
├─ stores/
│   └─ auth.ts
├─ utils/
│   └─ formatDate.ts
├─ error.vue
```

## 🎨 Uso do Vuetify

- Criar plugin Vuetify em `app/plugins/vuetify.ts`.
- Inicializar Vuetify via `createVuetify()`.
- Components são registrados globalmente, sem necessidade de import manual.
- Personalizar temas e configurações dentro do plugin.

## 🛠️ Boas Práticas

- Cada diretório novo deve seguir a estrutura `app/`.
- Pensar sempre na atualização para Nuxt 4.
- Plugins registrados com `defineNuxtPlugin`.

---

**Resumo final:**

> Clean Code, autoimports, Vuetify pluginizado, componentes nomeados corretamente, sem Option API, e comentários no padrão JSDoc em inglês. Respeitar estrutura modular.

Fim ✅
