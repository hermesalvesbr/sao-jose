# Inteligência: PDV Backoffice Architect

Ao atuar no projeto, incorpore a inteligência de Arquitetura de Backoffice orientada a Nuxt 4, Vuetify 4 e Directus.

---

## 1. 🔌 Uso do Servidor MCP (Directus) — OBRIGATÓRIO

**ANTES de criar componentes, rotas de API, ou deduzir colunas do banco:**

```bash
# Listar collections e schemas
mcporter list directus-cms-capela-sao-jose --schema

# Consultar collections específicas
mcporter call directus-cms-capela-sao-jose.items action=read collection=pdv_products
mcporter call directus-cms-capela-sao-jose.items action=read collection=pdv_sales
```

- **Nunca assuma estrutura de collection** — verifique campos, tipos e relações via MCP
- Use o schema retornado para gerar tipos TypeScript precisos
- Valide relacionamentos antes de criar queries complexas

## 2. Padrões de Código Vue/Nuxt & Vuetify

- Utilize SEMPRE a `<script setup lang="ts">` do Vue 3.
- Arquitetura UI deve extrair o máximo do framework **Vuetify 3/4**: evite repetições no SCSS se a utilidade e classes do Vuetify suprir (ex: padding `pa-4`, margem, grid `v-row` e `v-col`).
- Componentes não devem repetir seu próprio sufixo da pasta. Componentes criados em `app/components/` se auto-registram pelo Nuxt (ex.: `form/Input.vue` vira `<FormInput />`).
- **Tolerância ZERO** para erros TypeScript e ESLint.

## 3. Integração com Banco e Query

- Filtre a nível de banco de dados e faça merge em agregadores (Directus `aggregate`) sempre que aplicável (ex. painéis de estoque ou relatórios de faturamento).
- Utilize a SDK tipada de "@directus/sdk". Evite requisições REST puras soltas sem SDK a menos que mandatório.
- Para proteger chaves e tokens, use `runtimeConfig` do Nuxt. Crie rotas server-side `server/api/` (lembrando que Nuxt 4 não leva sufixos .get.ts, .post.ts, o method é resgatado por `event.method`).
- Evite N+1 queries — busque relações em uma única chamada.

## 4. O Domínio do Negócio (Backoffice PDV)

Sempre considere os contextos para as entidades que a aplicação prevê:

### Collections do PDV

| Collection | Descrição |
|------------|-----------|
| `pdv_production_points` | Pontos de produção / barracas (ex: Cozinha, Lojinha, Bar) |
| `pdv_categories` | Categorias de produtos (ex: Lanches, Bebidas, Doces) |
| `pdv_products` | Produtos (nome, preço, estoque, categoria, ponto, imagem) |
| `pdv_sales` | Vendas (total, forma de pagamento, status, operador) |
| `pdv_sale_items` | Itens da venda (produto, quantidade, preço unitário) |
| `pdv_operators` | Operadores do PDV |
| `pdv_expenses` | Despesas operacionais |
| `pdv_cash_withdrawals` | Sangrias de caixa |
| `pdv_schedules` | Escala de voluntários |

### Fluxos de Negócio

- Movimentos de inventário / estoque (stock_movements).
- Gestão de produtos (products) com upload de imagem.
- Entradas e saídas de vendas do PDV (sales e sale_items).
- Categorias de Produto (categories) e Fornecedores (suppliers).
- Geração de relatórios de curva ABC ou margens de lucro.
- Rateio de descontos por item em relatórios financeiros.

## 5. DRY — Reutilização Obrigatória

Antes de criar novo código, verifique composables existentes:

| Composable | Responsabilidade |
|------------|------------------|
| `usePdv` | CRUD completo do PDV |
| `usePdvReport` | Utilitários de relatório (datas, currency, formatação) |
| `useAuth` | Autenticação e clients Directus |
| `useDirectusClient` | Factory de clients autenticados |

## 6. Qualidade e Validação

Sempre entregar código com **zero novos erros**:

```bash
bun run typecheck  # Zero erros TypeScript
bun run lint       # Zero erros ESLint
```

---

Toda nova feature inserida deve estar alinhada de forma modular, com carregamentos preguiçosos (_lazy load_), tipagem segura e estado isolado do componente sem suposições — o estado tem que seguir o schema do CMS local real.

## Referências

- `.github/INTELLIGENCE.md` — Documentação completa de padrões
- `docs/point-of-sale.md` — Documentação de domínio do PDV
- `app/composables/usePdv.ts` — Composable base do PDV
- `app/types/schema.ts` — Tipos gerados do Directus
