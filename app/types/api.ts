/** Tipos de resposta das APIs internas (não gerados pelo Directus) */

/** Entrada de log de exibição retornada por GET /api/anunciantes/:id */
export interface AdsLogEntry {
  id: string
  exibido_em: string
  duracao_exibida: number
  anunciante: string
  tipo_midia: string
}

/** Resumo de anunciante retornado por GET /api/anunciantes */
export interface AnuncianteResumo {
  id: string
  anunciante: string
  tipo_midia: string
  duracao: number
  midia: string
  total_exibicoes: number
  total_duracao_exibida: number
  ultima_exibicao: string | null
}

export interface PublicPdvPoint {
  id: string
  name: string
  emoji: string
  role: string
  sort: number
}

export interface PublicPdvCategory {
  id: string
  name: string
  icon: string
  sort_order: number
  point: PublicPdvPoint | null
}

export interface PublicPdvProduct {
  id: string
  name: string
  price: number
  stock_quantity: number
  sort_order: number
  imagem: string | null
  emoji: string
  category_id: string
  production_point_id: string | null
}

export interface PublicPdvCatalogResponse {
  points: PublicPdvPoint[]
  categories: PublicPdvCategory[]
  products: PublicPdvProduct[]
  defaultPointId: string | null
}

export interface PublicPdvCartItemInput {
  productId: string
  quantity: number
}

export interface PublicPdvSaleRequest {
  operatorName: string
  paymentMethod: 'dinheiro' | 'pix' | 'cartao'
  pointId: string | null
  items: PublicPdvCartItemInput[]
}

export interface PublicPdvReceiptItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  pointName: string | null
}

export interface PublicPdvSaleResponse {
  saleId: string
  saleNumber: number | null
  createdAt: string
  operatorName: string
  paymentMethod: 'dinheiro' | 'pix' | 'cartao'
  totalAmount: number
  pointName: string | null
  items: PublicPdvReceiptItem[]
}

export interface PublicPdvMarkPrintedRequest {
  saleId: string
}

export interface PublicPdvOperatorResponse {
  id: string
  name: string
  isNew?: boolean
}
