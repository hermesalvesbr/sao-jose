import type { AdsLogEntry, AnuncianteResumo } from '~/types/api'
import type { AdsNovenario } from '~/types/schema'

export interface AnuncianteDetalhe {
  ad: AdsNovenario
  logs: AdsLogEntry[]
}

export function useAnunciantesPublico() {
  function formatarTempo(segundos: number): string {
    if (segundos < 60)
      return `${segundos}s`
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return seg > 0 ? `${min}min ${seg}s` : `${min}min`
  }

  function formatarMoeda(valor: number): string {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function custoSegundo(valorPago: number, totalDuracao: number): string {
    if (!totalDuracao)
      return '—'
    return (Number(valorPago) / totalDuracao).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 4,
    })
  }

  function formatarDataHora(dt: string | null): string {
    if (!dt)
      return '—'
    return new Date(dt).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatarData(dt: string | null): string {
    if (!dt)
      return '—'
    return new Date(dt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
  }

  function formatarHora(dt: string | null): string {
    if (!dt)
      return '—'
    return new Date(dt).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  async function fetchAnunciantes(): Promise<AnuncianteResumo[]> {
    return $fetch<AnuncianteResumo[]>('/api/anunciantes')
  }

  async function fetchAnuncianteDetalhe(id: string): Promise<AnuncianteDetalhe> {
    return $fetch<AnuncianteDetalhe>(`/api/anunciantes/${id}`)
  }

  return {
    formatarTempo,
    formatarMoeda,
    custoSegundo,
    formatarDataHora,
    formatarData,
    formatarHora,
    fetchAnunciantes,
    fetchAnuncianteDetalhe,
  }
}
