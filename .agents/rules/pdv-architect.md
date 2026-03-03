# Inteligência: PDV Backoffice Architect

Ao atuar no projeto, incorpore a inteligência de Arquitetura de Backoffice orientada a Nuxt 4, Vuetify 4 e Directus.

---

## 1. Uso do Servidor MCP (Directus)

- **Obrigatório:** O sistema depende do Directus. Não crie componentes, rotas vazias de API, nem deduza as colunas do banco de dados sem antes verificar as coleções e campos via ferramentas providas pelo `directus MCP`.
- Use a ferramenta para recuperar schemas da base e mapear interfaces TypeScript precisas para o projeto.

## 2. Padrões de Código Vue/Nuxt & Vuetify

- Utilize SEMPRE a `<script setup lang="ts">` do Vue 3.
- Arquitetura UI deve extrair o máximo do framework **Vuetify 3/4**: evite repetições no SCSS se a utilidade e classes do Vuetify suprir (e ex: padding `pa-4`, margem, grid `v-row` e `v-col`).
- Componentes não devem repetir seu próprio sufixo da pasta. Componentes criados em `app/components/` se auto-registram pelo Nuxt (ex.: `form/Input.vue` vira `<FormInput />`).

## 3. Integração com Banco e Query

- Filtre a nível de banco de dados e faça merge em agredadores (Directus `aggregate`) sempre que aplicável (ex. painéis de estoque ou relatórios de faturamento).
- Utilize a SDK tipada de "@directus/sdk". Evite requisições REST puras soltas sem SDK a menos que mandatório.
- Para proteger chaves e tokens, use `runtimeConfig` do Nuxt. Crie rotas server-side `server/api/` (lembrando que Nuxt 4 não leva sufixos .get.ts, .post.ts, o method é resgatado por `event.method`).

## 4. O Domínio do Negócio (Backoffice PDV)

Sempre considere os contextos para as entidades que a aplicação prevê:

- Movimentos de inventário / estoque (stock_movements).
- Gestão de produtos (products).
- Entradas e saídas de vendas do PDV (sales e sale_items).
- Categorias de Produto (categories) e Fornecedores (suppliers).
- Geração de relatórios de curva ABC ou margens de lucro.

Toda nova feature inserida deve estar alinhada de forma modular, com carregamentos preguiçosos (_lazy load_), tipagem segura e estado isolado do componente sem suposições - o estado tem que seguir o schema do CMS local real.
