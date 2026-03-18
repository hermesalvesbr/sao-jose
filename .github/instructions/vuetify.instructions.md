---
name: Vuetify 4 UI Rules
description: Regras para construção de UI com Vuetify no projeto
applyTo: "app/**/*.vue"
---

# Vuetify 4 — Regras e Padrões Visuais

## 🔌 MCP Directus — Verificar Dados Antes de Criar UI

Antes de criar componentes que exibem dados do Directus:

```bash
# Consultar schema das collections
mcporter list directus-cms-capela-sao-jose --schema
```

Isso garante que seus componentes usem os nomes de campos corretos e tipos adequados.

## Referências

- `.github/INTELLIGENCE.md` — Guia completo de padrões de geração de código
- `app/plugins/vuetify.ts` — Configuração do tema e defaults
- `.github/instructions/vue-components.instructions.md` — Padrões de componentes Vue

## Fundamentos

- Use Vuetify components e grid system; nunca layout ad-hoc com CSS customizado.
- Respeite os defaults do projeto definidos em `app/plugins/vuetify.ts` (VBtn, VCard, VTextField, VSelect, VAutocomplete).
- Use tokens do tema (`primary`, `secondary`, `error`, `surface-variant`, etc.); nunca cores hexadecimais inline.
- Prefira classes utilitárias Vuetify/spacing (`pa-4`, `me-2`, `mb-4`, `d-flex`, `text-h5`) em vez de CSS customizado.
- Para comportamento responsivo, use `useDisplay()` ou classes utilitárias (`d-none d-sm-flex`, `flex-column flex-sm-row`).
## Padrão de Cores para Botões de Ação

| Ação | Variant | Color | Icon | Uso | Razão UX |
|---|---|---|---|---|---|
| **Adicionar / Criar** | `elevated` | `success` | `mdi-plus` | "Nova Entrada", "Adicionar Item" | Verde = crescimento, clareza intuitiva |
| **Imprimir / Exportar** | `tonal` | `info` | `mdi-printer` ou `mdi-download` | "Imprimir", "Exportar PDF" | Azul = informação, ação não-destrutiva |
| **Salvar / Confirmar** | `elevated` | `primary` (default) | `mdi-check` | "Salvar", "Confirmar" | Azul primário = ação crítica, CTA padrão |
| **Cancelar / Fechar** | `text` | — | `mdi-close` | "Cancelar", "Voltar" | Sem cor = reversível, baixa prioridade |
| **Editar / Atualizar** | `icon` (small) | `primary` | `mdi-pencil` | Inline em tabelas | Ícone discreto, sem carregamento visual |
| **Excluir / Arquivar** | `tonal` | `error` | `mdi-trash-can` ou `mdi-archive` | Ações destrutivas (com confirmação) | Vermelho = perigo, atrai atenção corretamente |
| **Voltar / Back** | `text` | — | `mdi-arrow-left` | Header de sub-página | Sem cor = navegação, não ação |

---

## Implementação no Template


---

## Depreciações e Remoções no Vuetify 4 (NUNCA USE)

| ❌ Proibido | ✅ Correto |
|---|---|
| `dense` em `v-row` | Removido. Use `class="ga-2"` ou omita o atributo |
| `active-color` em `v-list-item` / `v-list-group` | Use `color="primary"` |
| `v-number-input` (labs) para contadores | Use `v-list` + botões `mdi-minus` / `mdi-plus` (ver seção Contador) |
| `align="left"` / `align="right"` em colunas de tabela | Use `align: 'start'` / `align: 'end'` |
| `dense` em `v-data-table` | Use `density="compact"` se necessário |

---

## Padrão de Página Admin

Toda página admin deve seguir esta estrutura:

```vue
<template>
  <v-container fluid class="pa-2 pa-md-6">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-4 mb-sm-6">
      <div>
        <div class="d-flex align-center mb-2">
          <!-- Botão back (somente em sub-páginas) -->
          <v-btn variant="text" icon="mdi-arrow-left" class="me-2" to="/admin/rota-pai" />
          <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
            Título da Página
          </h1>
        </div>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0 ms-11">
          Descrição breve da página
        </p>
      </div>
      <!-- Ações no canto direito -->
      <div class="d-flex gap-2 mt-3 mt-sm-0 d-print-none">
        <v-btn variant="tonal" prepend-icon="mdi-printer" @click="printList">Imprimir</v-btn>
        <v-btn variant="elevated" prepend-icon="mdi-plus" to="/admin/rota/add">Nova Entrada</v-btn>
      </div>
    </div>

    <!-- Conteúdo -->
  </v-container>
</template>
```

**Regras do header:**
- Título: `class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1"`.
- Subtítulo: `class="text-body-2 text-medium-emphasis mt-1 mb-0 ms-11"` (`ms-11` alinha com o texto depois do botão back).
- Botão back: sempre `variant="text"` + `icon="mdi-arrow-left"` + prop `to=` (router-link, sem JS navigation manual).

---

## Variantes de Botão

| Uso | Variant | Color | Exemplo |
|---|---|---|---|
| Ação primária (CTA principal) | `elevated` | `primary` (default) | "Salvar", "Nova Oferta" |
| Ação secundária / impressão | `tonal` | `primary` (default) | "Imprimir", "Exportar" |
| Ação de cancelamento | `text` | — | "Cancelar" |
| Ação destrutiva | `tonal` | `error` | "Arquivar", "Excluir" |
| Botão de ícone (back, fechar) | `text` | — | `icon="mdi-arrow-left"` |
| Botão de ícone inline em tabela | `icon` (size `small`) | — | Ações em linhas de tabela |

---

## Cards

- Defaults do plugin: `elevation="0"`, `rounded="lg"`. Não redundar essas props.
- Para cards de formulário com destaque visual: `elevation="2"`.
- Estrutura interna padrão:

```vue
<v-card elevation="2" rounded="lg">
  <v-card-title class="d-flex align-center pa-4">
    <v-icon color="primary" class="me-2">mdi-xxx</v-icon>
    <span class="text-h6">Título do Card</span>
  </v-card-title>
  <v-divider />
  <v-card-text class="pa-4">
    <!-- conteúdo -->
  </v-card-text>
</v-card>
```

---

## Formulários

- Defaults do plugin: `VTextField`, `VSelect`, `VAutocomplete` já têm `variant="outlined"` e `density="comfortable"`. Não redundar.
- Estrutura padrão com duas colunas (dados + calculadora/preview):

```vue
<v-row>
  <v-col cols="12" md="5" lg="4">
    <!-- Card: dados do formulário -->
  </v-col>
  <v-col cols="12" md="7" lg="8">
    <!-- Card: calculadora ou preview -->
  </v-col>
</v-row>
```

- Usar `<v-form @submit.prevent="salvar">` para capturar Enter.
- Campos numéricos/monetários: usar `MaskedCurrencyField`.
- Campos de data: usar `MaskedDateField`.
- Campos com máscara: usar `MaskedTextField`.

---

## Padrão de Contador / Stepper (Cédulas/Moedas)

Nunca usar `v-number-input`. Usar `v-list` com botões inline:

```vue
<v-list lines="two">
  <v-list-item
    v-for="item in denominacoes"
    :key="item.valor"
    :title="item.label"
    :subtitle="`Subtotal: ${formatCurrency(item.valor * item.quantidade)}`"
  >
    <template #append>
      <div class="d-flex align-center gap-2">
        <v-btn icon="mdi-minus" size="small" variant="tonal" :disabled="item.quantidade === 0" @click="item.quantidade--" />
        <span class="text-body-1 font-weight-bold" style="min-width: 24px; text-align: center">{{ item.quantidade }}</span>
        <v-btn icon="mdi-plus" size="small" variant="tonal" @click="item.quantidade++" />
      </div>
    </template>
  </v-list-item>
</v-list>
```

---

## Diálogo de Confirmação (Ações Destrutivas)

```vue
<v-dialog v-model="confirmDialog" max-width="420">
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon color="warning" class="me-2">mdi-alert-outline</v-icon>
      Confirmar ação
    </v-card-title>
    <v-card-text>Mensagem de confirmação aqui.</v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="confirmDialog = false">Cancelar</v-btn>
      <v-btn color="error" variant="tonal" :loading="processando" @click="executarAcao">
        Confirmar
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
```

---

## Snackbar de Feedback

```vue
<v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="bottom end">
  {{ snackbarMsg }}
</v-snackbar>
```

- Cores: `success`, `error`, `warning`, `info`.
- Disparar após ação assíncrona.

---

## Tabelas (v-data-table)

```ts
const headers: VDataTable['headers'] = [
  { title: 'Nome', key: 'nome', sortable: true, align: 'start' },
  { title: 'Valor', key: 'valor', sortable: true, align: 'end' },
  { title: 'Data',  key: 'data',  sortable: true, align: 'center' },
  { title: '',      key: 'acoes', sortable: false, align: 'end', width: '100px' },
]
```

- Sempre usar `align: 'start' | 'center' | 'end'` — nunca `'left'` / `'right'`.
- Coluna de ações: key `acoes`, sem título, `sortable: false`, `width: '100px'`.
- Botões de ação inline: `v-btn` com `icon`, tamanho `small`, `variant="text"` ou `"icon"`.

---

## Layout de Filtros

```vue
<v-row align="center" class="mb-4 d-print-none">
  <v-col cols="12" sm="auto">
    <MaskedDateField v-model="dataInicio" label="De" />
  </v-col>
  <v-col cols="12" sm="auto">
    <MaskedDateField v-model="dataFim" label="Até" />
  </v-col>
  <v-col cols="12" sm="auto">
    <v-btn variant="tonal" @click="aplicarMesAtual">Este mês</v-btn>
    <v-btn variant="text" @click="limparFiltro">Limpar</v-btn>
  </v-col>
</v-row>
```

- **Nunca usar `dense` em `v-row`** (depreciado no Vuetify 4).
- Usar `align="center"` para alinhamento vertical dos filtros.
- Espaçamento via classes utilitárias, não CSS inline.

---

## Print Layout

- Elementos que NÃO devem aparecer na impressão: `class="d-print-none"` (filtros, botões, coluna de ações).
- Elementos que só devem aparecer na impressão: `class="d-none d-print-block"`.
- `window.print()` no handler do botão de impresão.

---

## Navegação e Roteamento

- Botões de navegação: usar prop `to="/rota"` (router-link) em vez de `@click="router.push(...)"`.
- Nunca usar `next()` em middleware; usar `return navigateTo('/rota')`.
- Após salvar formulário: `await navigateTo('/admin/rota-pai')`.

---

## Cores e Tipografia

| Uso | Classe |
|---|---|
| Título de página | `text-secondary-darken-1 font-weight-bold` |
| Subtítulo / descrição | `text-medium-emphasis` |
| Ícone em card title | `color="primary"` |
| Total / destaque financeiro | `text-primary font-weight-bold` |
| Texto desabilitado | `text-disabled` |
| Tipografia: título principal | `text-h5 text-md-h4` |
| Tipografia: título de seção | `text-h6` |
| Tipografia: corpo | `text-body-1` / `text-body-2` |
