# Architecture Decisions

## System Overview

### Technology Stack
- **Framework:** Nuxt 4 + Vue 3
- **UI:** Vuetify 4 (custom theme: cidadeTema)
- **Backend:** Directus 11 (headless CMS)
- **Language:** TypeScript
- **Package Manager:** Bun
- **SDK:** `@directus/sdk`

### Project Structure
```
sao-jose/
├── app/                    # Frontend application
│   ├── components/         # Vue components (reusable)
│   │   ├── birthday/       # Birthday-related components
│   │   ├── pdv/            # PDV-specific components
│   │   ├── print/          # Print report components
│   │   └── Masked*.vue     # Form input wrappers
│   ├── composables/        # State management & API calls
│   ├── layouts/            # Layout templates (admin, default)
│   ├── middleware/         # Route guards (auth.global.ts)
│   ├── pages/              # Route pages
│   │   ├── admin/          # Admin section
│   │   │   ├── pdv/        # PDV management
│   │   │   ├── dizimos/    # Tithes management
│   │   │   ├── receitas/   # Revenues
│   │   │   └── anuncio/    # Advertisements
│   │   └── public/         # Public pages
│   ├── types/              # TypeScript types
│   └── utils/              # Helper utilities
├── server/                 # Server-side code
│   ├── api/                # API endpoints (BFF layer)
│   └── utils/              # Server utilities
├── docs/                   # Feature documentation
├── tasks/                  # Engineering intelligence (NEW)
└── .claude/skills/         # Engineering skills (NEW)
```

---

## Architectural Decisions

### [No decisions recorded yet]

---

## Decision Format

### [Decision Title]

**Date:** YYYY-MM-DD

**Context:** [What led to this decision]

**Decision:** [What we decided]

**Consequences:** [Trade-offs, implications]

**Status:** [Proposed | Accepted | Deprecated]

---

## Domain Model

### Core Business Entities

| Entity | Description | Key Files |
|--------|-------------|-----------|
| **Dízimos** | Member tithes and contributions | `composables/useDizimos.ts`, `pages/admin/dizimos/*` |
| **Ofertório** | Church offerings | `composables/useOfertas.ts`, `pages/admin/ofertorio/*` |
| **Receitas** | Revenue records | `composables/useReceitas.ts`, `pages/admin/receitas/*` |
| **PDV** | Point of sale system | `composables/usePdv.ts`, `usePublicPdv.ts`, `pages/admin/pdv/*` |
| **Agenda** | Church schedule/events | `composables/useAgenda.ts`, `pages/programacao.vue` |
| **Aniversariantes** | Birthday tracking | `composables/useAniversariantes.ts`, `pages/aniversariantes.vue` |
| **Anunciantes** | Advertisers/sponsors | `composables/useAnunciantesPublico.ts`, `pages/anunciantes/*` |
| **Ads Novenário** | Novenary ad tracking | `composables/useAdsNovenario.ts`, `server/api/ads-novenario.ts` |

### PDV Domain (Point of Sale)

**Production Points:**
- 🍔 Cozinha (hot food)
- 🧁 Confeitaria (sweets)
- 🍺 Bar/Bebidas (beverages)
- 🛍️ Lojinha (religious articles)

**Collections (Directus, `pdv_*` prefix):**
- `pdv_categories` - Product categories
- `pdv_products` - Product catalog
- `pdv_production_points` - Production points
- `pdv_sales` - Sales records
- `pdv_sale_items` - Sale line items
- `pdv_operators` - PDV operators

### Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Login     │────>│  Directus    │────>│   Admin     │
│   Page      │     │    Auth      │     │   Layout    │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           v
                    ┌──────────────┐
                    │  JWT Token   │
                    │  (storage)   │
                    └──────────────┘
```

**Key Files:**
- `composables/useAuth.ts` - Authentication state
- `middleware/auth.global.ts` - Route protection
- `layouts/admin.vue` - Protected layout

---

## Integration Points

### External Systems

| System | Purpose | Implementation |
|--------|---------|----------------|
| **Directus API** | Data persistence, file storage, auth | `composables/useDirectusClient.ts`, `server/api/directus.ts` |
| **USB ESC/POS Printers** | Receipt printing | `composables/useUsbEscPosPrinter.ts` |
| **Printer Reporting** | Cash handover reports | `components/print/Print*` components |

### Internal API Layer (BFF Pattern)

Server endpoints act as Backend-for-Frontend:

| Endpoint | Purpose |
|----------|---------|
| `/api/agenda` | Schedule data |
| `/api/aniversariantes` | Birthday data |
| `/api/anunciantes` | Advertiser data |
| `/api/directus` | Directus proxy |
| `/api/pdv/*` | PDV operations (catalog, sale, operator) |
| `/api/ads-*` | Ad tracking for Novenário |
| `/api/quermesse` | Kermesse data |
