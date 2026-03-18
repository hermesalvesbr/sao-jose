# 🧠 Inteligência de Geração de Código — Capela São José

> Documentação aprimorada seguindo as melhores práticas da Anthropic para criação de skills e agents eficazes.

---

## 📋 Visão Geral

Este projeto é um sistema de gestão paroquial e PDV construído com:

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | Nuxt 4 + Vue 3 + Vuetify 4 + TypeScript |
| **Backend/CMS** | Directus 11 (PostgreSQL) |
| **SDK** | `@directus/sdk` |
| **Package Manager** | Bun |
| **Ícones** | @mdi/font (Material Design Icons) |

---

## 🔌 MCP Directus — Fonte da Verdade

### ⚠️ OBRIGATÓRIO: Consulte o MCP antes de gerar código

Este projeto integra **dois ambientes Directus** via MCP. Sempre consulte o schema antes de:
- Criar novos componentes que consomem dados
- Escrever queries Directus
- Sugerir modificações no banco de dados

### Comandos MCP Disponíveis

```bash
# Listar collections e schemas
mcporter list directus-cms-softagon-app --schema    # Softagon (dev/staging)
mcporter list directus-cms-capela-sao-jose --schema # Capela São José (prod)

# Consultar dados específicos
mcporter call directus-cms-capela-sao-jose.system-prompt
mcporter call directus-cms-capela-sao-jose.items action=read collection=dizimos
mcporter call directus-cms-capela-sao-jose.items action=read collection=oferta_financeira
mcporter call directus-cms-capela-sao-jose.items action=read collection=pdv_sales
```

### Collections Principais

#### Gestão Paroquial
| Collection | Descrição |
|------------|-----------|
| `catolico` | Fiéis cadastrados (nome, telefone, nascimento) |
| `dizimista` | Dízimos ativos (relacionado com catolico, valor_mensal) |
| `pagamento_dizimo` | Histórico de pagamentos de dízimos |
| `oferta_financeira` | Registro de ofertas do ofertório |
| `receitas` | Receitas avulsas (doações, campanhas, rifas) |
| `agenda` | Agenda de eventos e missas |
| `instituicao` | Instituições/comunidades |

#### PDV (Ponto de Venda)
| Collection | Descrição |
|------------|-----------|
| `pdv_production_points` | Pontos de produção/barracas |
| `pdv_categories` | Categorias de produtos |
| `pdv_products` | Catálogo de produtos |
| `pdv_sales` | Vendas realizadas |
| `pdv_sale_items` | Itens das vendas |
| `pdv_operators` | Operadores do PDV |
| `pdv_expenses` | Despesas do PDV |
| `pdv_cash_withdrawals` | Sangrias de caixa |
| `pdv_schedules` | Escala de voluntários |

#### Anúncios/Telão
| Collection | Descrição |
|------------|-----------|
| `ads_novenario` | Anúncios patrocinados |
| `ads_log` | Log de exibições do telão |

---

## 🏗️ Arquitetura do Projeto

```
sao-jose/
├── app/
│   ├── components/          # Componentes Vue auto-registrados
│   │   ├── pdv/            # Componentes do PDV
│   │   ├── print/          # Componentes de impressão
│   │   └── birthday/       # Componentes de aniversariantes
│   ├── composables/         # Lógica reutilizável (use*)
│   │   ├── useAuth.ts      # Autenticação Directus
│   │   ├── useDirectusClient.ts # Client factory
│   │   ├── usePdv.ts       # Operações PDV
│   │   ├── usePdvReport.ts # Utilitários de relatório
│   │   ├── useDizimos.ts   # Gestão de dízimos
│   │   └── useOfertas.ts   # Gestão de ofertas
│   ├── layouts/            # Layouts da aplicação
│   │   ├── admin.vue       # Layout admin (sidebar)
│   │   └── default.vue     # Layout público
│   ├── middleware/         # Middleware global
│   │   └── auth.global.ts  # Autenticação automática
│   ├── pages/              # Páginas e rotas
│   │   ├── admin/          # Área administrativa
│   │   │   ├── pdv/        # PDV backoffice
│   │   │   ├── dizimos/    # Gestão de dízimos
│   │   │   └── ...
│   │   └── pdv.vue         # PDV frontend (fullscreen)
│   ├── plugins/            # Plugins Nuxt
│   │   └── vuetify.ts      # Configuração Vuetify
│   ├── types/              # Tipos TypeScript
│   │   ├── schema.ts       # Types gerados do Directus
│   │   └── api.ts          # Types de API
│   └── utils/              # Utilitários
├── server/
│   ├── api/                # Endpoints server-side
│   │   ├── pdv/            # API do PDV
│   │   ├── agenda.ts
│   │   ├── aniversariantes.ts
│   │   └── ...
│   └── utils/
│       └── directus.ts     # Server Directus client
├── .github/
│   ├── agents/             # Agentes especializados
│   ├── instructions/       # Instruções por contexto
│   └── prompts/            # Prompts reutilizáveis
└── docs/                   # Documentação de domínio
```

---

## 📜 Regras de Geração de Código

### 1. TypeScript Strict (Tolerância ZERO)

```typescript
// ❌ NUNCA FAÇA
const data: any = await fetch()
let count: any = 0

// ✅ SEMPRE FAÇA
const data = await fetchData() // Tipo inferido ou explícito
let count = 0 // Tipo inferido de number
const values: number[] = [] // Array tipado
```

**Regras:**
- Zero erros TypeScript no build
- Evite `any` — use tipos de `app/types/schema.ts`
- Use interfaces do Directus: `ApiCollections['pdv_products']`
- Tipagem explícita em retornos de funções públicas

### 2. Vue 3 Composition API Only

```vue
<script setup lang="ts">
// ✅ CORRETO
const count = ref(0)
const doubled = computed(() => count.value * 2)

// ❌ NUNCA USE Options API
export default {
  data() { return { count: 0 } } // PROIBIDO
}
</script>
```

### 3. Auto-imports do Nuxt (Não Importe Manualmente)

```typescript
// ❌ NÃO FAÇA — São auto-importados
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { definePageMeta, useHead } from '#app'

// ✅ FAÇA — Use diretamente
const count = ref(0)
const route = useRoute()
definePageMeta({ layout: 'admin' })
```

**Auto-imports disponíveis:**
- Vue: `ref`, `reactive`, `computed`, `watch`, `onMounted`, etc.
- Nuxt: `useRoute`, `useRouter`, `navigateTo`, `useState`, `$fetch`
- Metas: `definePageMeta`, `useHead`, `useSeoMeta`
- Composables do projeto: `useAuth`, `usePdv`, `useDirectusClient`, etc.

### 4. Padrão de Composables

```typescript
// app/composables/useExample.ts
export function useExample() {
  const { getAuthClient } = useAuth() // Reuse auth existente
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const fetchData = async (query = {}) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(readItems('collection', query))
    }
    catch (e) {
      error.value = e as Error
      throw e
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchData,
  }
}
```

**Regras:**
- Nome sempre começa com `use`
- Mantenha state explícito: `loading`, `error`, `data`
- Use `try/finally` para garantir cleanup do loading
- Reuse `useAuth().getAuthClient()` em vez de criar novo client

### 5. Padrão de Componentes Vue

```vue
<script setup lang="ts">
definePageMeta({ layout: 'admin' })

// Props tipadas
interface Props {
  itemId?: string
  title?: string
}
const props = withDefaults(defineProps<Props>(), {
  itemId: '',
  title: 'Título Padrão',
})

// Emits tipados
const emit = defineEmits<{
  save: [data: FormData]
  cancel: []
}>()

// Estado e lógica
const loading = ref(false)
const { fetchData } = useExample()
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Header padrão admin -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-5 ga-3">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          {{ title }}
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Descrição da página
        </p>
      </div>
      <div class="d-flex ga-2">
        <v-btn variant="tonal" color="info" prepend-icon="mdi-printer">
          Imprimir
        </v-btn>
        <v-btn variant="elevated" color="success" prepend-icon="mdi-plus">
          Novo
        </v-btn>
      </div>
    </div>

    <!-- Conteúdo -->
  </v-container>
</template>
```

### 6. Padrão de Server API (Nuxt 4)

```typescript
// server/api/example.ts
// ❌ NÃO USE sufixos: .get.ts, .post.ts
// ✅ USE nomes neutros

export default defineEventHandler(async (event) => {
  // Validação de método se necessário
  assertMethod(event, 'GET')

  const client = createServerDirectusClient(event)
  const data = await client.request(readItems('collection'))

  return {
    success: true,
    data,
  }
})
```

**Regras:**
- Arquivos com nomes neutros (`agenda.ts`, não `agenda.get.ts`)
- Valide método HTTP dentro do handler se necessário
- Use `createServerDirectusClient(event)` para acesso seguro
- Nunca exponha tokens privados ao client

---

## 🎨 Padrões Vuetify 4

### Cores e Temas

```typescript
// ✅ USE tokens do tema
<v-btn color="primary" />
<v-btn color="success" />
<v-btn color="error" />

// ❌ NUNCA USE cores hex inline
<v-btn color="#1976D2" /> // PROIBIDO
```

### Grid System

```vue
<!-- ✅ CORRETO -->
<v-row align="center">
  <v-col cols="12" sm="6" md="4">
    <!-- Conteúdo -->
  </v-col>
</v-row>

<!-- ❌ ERRADO -->
<div class="flex">
  <div style="width: 50%">...</div>
</div>
```

### Classes Utilitárias

```vue
<!-- Espaçamento -->
<div class="pa-4 ma-2">Padding 4, margin 2</div>
<div class="mt-4 mb-2">Margin top 4, bottom 2</div>

<!-- Flexbox -->
<div class="d-flex align-center justify-space-between">
<div class="flex-column flex-sm-row">

<!-- Tipografia -->
<h1 class="text-h4 font-weight-bold">Título</h1>
<p class="text-body-2 text-medium-emphasis">Descrição</p>
```

### Padrão de Botões por Ação

| Ação | Variant | Color | Ícone |
|------|---------|-------|-------|
| Criar/Adicionar | `elevated` | `success` | `mdi-plus` |
| Salvar | `elevated` | `primary` | `mdi-check` |
| Imprimir/Exportar | `tonal` | `info` | `mdi-printer` |
| Editar | `icon` (small) | `primary` | `mdi-pencil` |
| Excluir/Arquivar | `tonal` | `error` | `mdi-trash-can` |
| Cancelar | `text` | — | `mdi-close` |
| Voltar | `text` | — | `mdi-arrow-left` |

---

## 🔐 Autenticação e Segurança

### Client Architecture

```typescript
// 1. Client autenticado (usuário logado)
const { getAuthClient } = useAuth()
const client = await getAuthClient()
// Usa autoRefresh + localStorage persistence

// 2. Client estático (páginas públicas)
const { public: { directus: { token } } } = useRuntimeConfig()
const client = getStaticClient(token)

// 3. Server client (nunca expõe token)
const serverClient = createServerDirectusClient(event)
```

### Regras de Segurança

1. **Token nunca exposto ao browser** — use server routes para operações sensíveis
2. **Use `runtimeConfig`** para variáveis de ambiente
3. **Auto-refresh habilitado** — SDK gerencia renovação de JWT
4. **LocalStorage adapter** — persistência robusta de tokens

---

## 📊 Padrões de Query Directus

### Agregações (Preferir no Banco)

```typescript
// ✅ CORRETO — Agregação no banco
const productsRes = await fetchProducts({
  aggregate: { count: '*' },
  filter: { stock_quantity: { _lte: 5 } },
})
const lowStockCount = Number(productsRes[0]?.count) || 0

// ❌ ERRADO — Trazer tudo e contar no client
const products = await fetchProducts()
const lowStockCount = products.filter(p => p.stock_quantity <= 5).length
```

### Evitar N+1 Queries

```typescript
// ✅ CORRETO — Buscar relações em uma query
const sales = await fetchSales({
  fields: [
    'id',
    'total_amount',
    'operator_id.id',
    'operator_id.name',
    'sale_items.*',
  ],
})

// ❌ ERRADO — Query por operador para cada venda
for (const sale of sales) {
  const operator = await fetchOperator(sale.operator_id)
}
```

### Filtros Complexos

```typescript
// Filtro com AND/OR
const filter = {
  _and: [
    { sale_status: { _eq: 'completed' } },
    { date_created: { _gte: dayStartBRT(dateFrom.value) } },
    { date_created: { _lte: dayEndBRT(dateTo.value) } },
  ],
}

const sales = await fetchSales({ filter })
```

---

## 🧪 Quality Gate (Obrigatório)

Antes de finalizar qualquer implementação:

```bash
# 1. Verificar TypeScript
bun run typecheck

# 2. Verificar ESLint
bun run lint

# 3. Build de verificação
bun run build
```

**Regra:** Zero novos erros de TypeScript e ESLint.

---

## 📁 Estrutura de Tipos

### Schema Types (Directus)

```typescript
// app/types/schema.ts — Gerado automaticamente
export interface ApiCollections {
  pdv_products: PdvProduct
  pdv_sales: PdvSale
  // ...
}

export interface PdvProduct {
  id: string
  name: string
  price: number
  stock_quantity: number
  // ...
}
```

### Uso em Composables

```typescript
import type { PdvProduct } from '~/types/schema'

const products = ref<PdvProduct[]>([])
const product = ref<PdvProduct | null>(null)
```

---

## 🔁 Padrões de Reutilização (DRY)

### Composables Existentes — SEMPRE VERIFICAR PRIMEIRO

| Composable | Responsabilidade |
|------------|------------------|
| `useAuth` | Autenticação, user state, clients |
| `useDirectusClient` | Factory de clients autenticados |
| `usePdv` | CRUD completo do PDV |
| `usePdvReport` | Utilitários de relatório (datas, formatação) |
| `useAgenda` | Dados de agenda/eventos |
| `useAniversariantes` | Aniversariantes (dia/semana/mês) |
| `useDizimos` | Gestão de dízimos e pagamentos |
| `useOfertas` | Ofertório |
| `usePublicSeo` | SEO para páginas públicas |

### Verificação DRY Antes de Criar Novo Módulo

1. Existe composable que já faz isso?
2. Posso extrair para função utilitária?
3. Posso reutilizar componente existente?
4. A lógica pode estar no server em vez de duplicada no client?

---

## 📝 Documentação de Código

### JSDoc para Funções Públicas

```typescript
/**
 * Busca produtos com estoque abaixo do mínimo
 * @param threshold - Quantidade máxima considerada como "baixo estoque" (default: 5)
 * @returns Lista de produtos com estoque baixo
 */
const fetchLowStockProducts = async (threshold = 5) => {
  // ...
}
```

### Comentários de Seção

```typescript
// ─── State ─────────────────────────────────────────────────────────────────────
const loading = ref(false)

// ─── Load Data ─────────────────────────────────────────────────────────────────
async function loadData() {
  // ...
}

// ─── Computed ──────────────────────────────────────────────────────────────────
const total = computed(() => {
  // ...
})
```

---

## 🚀 Fluxo de Desenvolvimento

### Para Nova Feature

1. **Consultar MCP Directus** — Verificar collections e campos
2. **Planejar tipos** — Definir interfaces em `schema.ts`
3. **Criar/Extender composable** — Lógica de dados em `app/composables/`
4. **Criar página/componente** — UI com Vuetify
5. **Adicionar rota server (se necessário)** — `server/api/`
6. **Quality Gate** — `bun run typecheck && bun run lint`

### Para Correção de Bug

1. **Reproduzir o erro** — Entender o comportamento atual vs esperado
2. **Identificar origem** — Log, type error, ou lógica
3. **Corrigir com mínimo impacto** — Fix focado
4. **Quality Gate** — Verificar zero erros novos

---

## 📞 Troubleshooting Comum

### Erro: "Cannot read property of undefined" em relações Directus

```typescript
// ❌ Frágil
const name = item.user_created.name

// ✅ Seguro
const name = typeof item.user_created === 'object'
  ? item.user_created.name
  : item.user_created
```

### Erro: TypeScript não reconhece tipo do Directus

```typescript
// Use a collection type correta
import type { ApiCollections } from '~/types/schema'
type MyCollection = ApiCollections['my_collection']
```

### Erro: ESLint com auto-imports

Verifique se não está importando manualmente algo que o Nuxt auto-importa.

---

## 📚 Referências

- [Nuxt 4 Documentation](https://nuxt.com/docs)
- [Vuetify 4 Documentation](https://vuetifyjs.com/)
- [Directus SDK](https://docs.directus.io/reference/packages/sdk.html)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Anthropic Skill Creation Guide](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills)

---

## 🔄 Atualizações

Esta documentação deve ser atualizada sempre que:
- Novas collections forem adicionadas ao Directus
- Novos composables compartilhados forem criados
- Padrões de arquitetura forem estabelecidos
- Novas ferramentas MCP forem configuradas

**Última atualização:** 2026-03-18
