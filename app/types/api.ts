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
