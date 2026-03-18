# 🙏 Sistema de Gestão — Capela São José

Sistema completo de gestão paroquial e ponto de venda para o Novenário de São José, com foco na organização da comunidade, acompanhamento dos fiéis e gestão financeira dos eventos.

## 🛠️ Tecnologias

| Camada              | Tecnologia                          |
| ------------------- | ----------------------------------- |
| **Back-end / CMS**  | Directus 11 (headless)              |
| **Front-end**       | Nuxt 4 + Vuetify 4 + TypeScript     |
| **Package Manager** | Bun                                 |
| **SDK**             | `@directus/sdk`                     |
| **Ícones**          | `@mdi/font` (Material Design Icons) |

## 🚀 Começando

```bash
# Instalar dependências
bun install

# Desenvolvimento
bun dev

# Build de produção
bun run build

# Verificação de tipos
bun run typecheck
```

## ✅ Funcionalidades

### 👥 Gestão de Fiéis

- Cadastro com nome, telefone (WhatsApp) e data de nascimento
- Lista de aniversariantes (dia, semana e mês)
- Filtro e busca de fiéis

### 💰 Controle de Dízimos

- Histórico de contribuições
- Visualização mensal e anual
- Relatórios para a coordenação da comunidade

### ⛪ Ofertório

- Registro de ofertas com valor, data e referência
- Relatórios de arrecadação

---

## 🏪 PDV — Ponto de Venda do Novenário

Sistema completo de vendas para o Novenário de São José, separando os pontos de produção entre **Barracas de Comida** e **Lojinha de Artigos Religiosos**.

### 📌 Pontos de Produção

O sistema separa os produtos por **ponto de produção**, permitindo que cada equipe gerencie suas vendas de forma independente:

| Ponto                | Descrição                      | Exemplos                             |
| -------------------- | ------------------------------ | ------------------------------------ |
| 🍔 **Cozinha**       | Alimentação quente             | Pastéis, cachorro-quente, espetinhos |
| 🧁 **Confeitaria**   | Doces e sobremesas             | Bolos, brigadeiros, cocadas          |
| 🍺 **Bar / Bebidas** | Bebidas em geral               | Refrigerantes, sucos, água           |
| 🛍️ **Lojinha**       | Artigos religiosos e souvenirs | Camisetas, chaveiros, santos         |

> **Padrão:** Ao cadastrar um novo produto, o ponto de produção **Lojinha** vem pré-selecionado.

### 💵 Fluxo de Troca / Pagamento

O sistema opera com um modelo simplificado para eventos paroquiais:

```text
╔══════════════════════════════════════════════════════════╗
║                    FLUXO DE VENDA                        ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  1. Operador seleciona categoria/produto                 ║
║  2. Adiciona ao carrinho (ajusta quantidade)              ║
║  3. Seleciona forma de pagamento:                        ║
║     💵 Dinheiro  |  📱 PIX  |  💳 Crédito  |  💳 Débito ║
║  4. Finaliza venda → baixa automática de estoque         ║
║  5. Confirmação visual com total                         ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  ⚠️  TROCO: disponível SOMENTE para pagamento em        ║
║      DINHEIRO. Outros métodos não geram troco.           ║
╚══════════════════════════════════════════════════════════╝
```

### 🖥️ Telas do PDV

| Rota                    | Descrição                                                                       |
| ----------------------- | ------------------------------------------------------------------------------- |
| `/admin/pdv`            | **Dashboard** — KPIs: total de produtos, estoque baixo, vendas e receita do mês |
| `/admin/pdv/terminal`   | **Terminal PDV** — Tela fullscreen de venda com grid de produtos e carrinho     |
| `/admin/pdv/produtos`   | **Produtos** — CRUD completo com imagem, categoria, ponto de produção e estoque |
| `/admin/pdv/categorias` | **Categorias** — Organização dos produtos por tipo                              |
| `/admin/pdv/pontos`     | **Pontos de Produção** — Barracas de Comida, Lojinha, etc.                      |
| `/admin/pdv/vendas`     | **Vendas** — Histórico de vendas com status e forma de pagamento                |

### 🎯 Terminal PDV (Fullscreen)

A tela principal de venda é otimizada para operação rápida:

- **Layout fullscreen** (`layout: false`) sem menu lateral
- **Grid de produtos** clicáveis com preço e estoque
- **Filtro por categoria** via chip-group
- **Busca instantânea** por nome do produto
- **Carrinho lateral** (desktop) ou **bottom-sheet** (mobile)
- **4 formas de pagamento:** Dinheiro, PIX, Crédito, Débito
- **Baixa automática de estoque** ao finalizar venda
- **Diálogo de sucesso** com auto-dismiss (3s)
- **FAB flutuante** no mobile com total do carrinho

### 📸 Cadastro de Produtos

- Nome, preço, estoque, categoria e ponto de produção
- **Upload de imagem** direto para o Directus via `uploadFiles` (SDK)
- Preview da imagem no formulário antes de salvar
- Suporte a JPEG, PNG e WebP

### 📊 Collections do Directus (prefixo `pdv_`)

| Collection              | Descrição                                                             |
| ----------------------- | --------------------------------------------------------------------- |
| `pdv_categories`        | Categorias de produtos (nome, ícone, ativo, ordem)                    |
| `pdv_products`          | Catálogo de produtos (nome, preço, estoque, categoria, ponto, imagem) |
| `pdv_production_points` | Pontos de produção / barracas (nome, ativo)                           |
| `pdv_sales`             | Vendas realizadas (total, forma de pagamento, status, operador)       |
| `pdv_sale_items`        | Itens da venda (produto, quantidade, preço unitário, subtotal)        |
| `pdv_operators`         | Operadores do PDV                                                     |

---

## 🎨 Tema e Design

O sistema usa um tema personalizado **cidadeTema** (tons de dourado/âmbar e marrom) com:

- Cores explícitas `on-*` para contraste WCAG
- Sidebar escura (`sidebarTheme`) com texto claro
- Surface variants do Vuetify 4
- Componentes Vuetify com density e variant customizados

## 🤝 Contribuição

Se você é da comunidade ou um dev de fé e quer contribuir, seja bem-vindo! 🙌

---

Com carinho,
**Equipe da Capela São José**
