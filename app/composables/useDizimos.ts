import { createItem, deleteItem, readItems, updateItem } from '@directus/sdk'

export function useDizimos() {
  const directus = useDirectusClient()

  // Estado reativo para armazenar os dados
  const dizimistas = ref<any[]>([])
  const pagamentos = ref<any[]>([])
  const catolicos = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Buscar todos os dizimistas
  const fetchDizimistas = async () => {
    loading.value = true
    error.value = null
    try {
      const client = await directus
      const response = await client.request(readItems('dizimista', {
        fields: [
          'id',
          'valor_mensal',
          'status',
          'date_created',
          'date_updated',
          {
            catolico: [
              'id',
              'nome',
              'telefone',
              'nascimento',
              'sexo',
            ],
          },
        ],
        sort: ['-date_created'],
        limit: -1,
      }))
      dizimistas.value = response
    }
    catch (err) {
      console.error('Erro ao buscar dizimistas:', err)
      error.value = 'Erro ao carregar dizimistas'
    }
    finally {
      loading.value = false
    }
  }

  // Buscar todos os católicos disponíveis (que ainda não são dizimistas)
  const fetchCatolicosDisponiveis = async () => {
    loading.value = true
    error.value = null
    try {
      const client = await directus
      const response = await client.request(readItems('catolico', {
        fields: ['id', 'nome', 'telefone', 'nascimento', 'sexo'],
        sort: ['nome'],
        limit: -1,
      }))
      catolicos.value = response
    }
    catch (err) {
      console.error('Erro ao buscar católicos:', err)
      error.value = 'Erro ao carregar católicos'
    }
    finally {
      loading.value = false
    }
  }

  // Buscar pagamentos de dízimo
  const fetchPagamentos = async (dizimistaId?: string) => {
    loading.value = true
    error.value = null
    try {
      const client = await directus
      const filter = dizimistaId ? { dizimista: { _eq: dizimistaId } } : {}

      const response = await client.request(readItems('pagamento_dizimo', {
        fields: [
          'id',
          'valor_pago',
          'meio',
          'data_pagamento',
          'status',
          'date_created',
          {
            dizimista: [
              'id',
              'valor_mensal',
              {
                catolico: [
                  'id',
                  'nome',
                ],
              },
            ],
          },
        ],
        filter,
        sort: ['-data_pagamento'],
        limit: -1,
      }))
      pagamentos.value = response
    }
    catch (err) {
      console.error('Erro ao buscar pagamentos:', err)
      error.value = 'Erro ao carregar pagamentos'
    }
    finally {
      loading.value = false
    }
  }

  // Criar novo dizimista
  const criarDizimista = async (dados: {
    catolico: string
    valor_mensal: number
  }) => {
    loading.value = true
    error.value = null
    try {
      const client = await directus
      const { user } = useAuth()

      const response = await client.request(createItem('dizimista', {
        ...dados,
        user_created: user.value?.id,
      }))

      await fetchDizimistas()
      return response
    }
    catch (err) {
      console.error('Erro ao criar dizimista:', err)
      error.value = 'Erro ao criar dizimista'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  // Atualizar dizimista
  const atualizarDizimista = async (id: string, dados: {
    valor_mensal?: number
    status?: string
  }) => {
    loading.value = true
    error.value = null
    try {
      const client = await directus
      const { user } = useAuth()

      const response = await client.request(updateItem('dizimista', id, {
        ...dados,
        user_updated: user.value?.id,
      }))

      await fetchDizimistas()
      return response
    }
    catch (err) {
      console.error('Erro ao atualizar dizimista:', err)
      error.value = 'Erro ao atualizar dizimista'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  // Registrar pagamento de dízimo
  const registrarPagamento = async (dados: {
    dizimista: string
    valor_pago: number
    meio: string
    data_pagamento: string
  }) => {
    loading.value = true
    error.value = null
    try {
      const client = await directus
      const { user } = useAuth()

      const response = await client.request(createItem('pagamento_dizimo', {
        dizimista: dados.dizimista,
        valor_pago: dados.valor_pago,
        meio: dados.meio,
        data_pagamento: new Date(dados.data_pagamento).toISOString(),
        user_created: user.value?.id,
      } as any))

      await fetchPagamentos()
      return response
    }
    catch (err) {
      console.error('Erro ao registrar pagamento:', err)
      error.value = 'Erro ao registrar pagamento'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  // Remover dizimista
  const removerDizimista = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const client = await directus
      await client.request(deleteItem('dizimista', id))
      await fetchDizimistas()
    }
    catch (err) {
      console.error('Erro ao remover dizimista:', err)
      error.value = 'Erro ao remover dizimista'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  // Computed para estatísticas
  const estatisticas = computed(() => {
    const totalDizimistas = dizimistas.value?.length || 0

    const valorMensalTotal = dizimistas.value?.reduce((total, dizimista) => {
      const valor = Number(dizimista.valor_mensal) || 0
      return total + valor
    }, 0) || 0

    const pagamentosEsteAno = pagamentos.value?.filter((pagamento) => {
      if (!pagamento.data_pagamento)
        return false
      const ano = new Date(pagamento.data_pagamento).getFullYear()
      return ano === new Date().getFullYear()
    }) || []

    const totalRecebidoAno = pagamentosEsteAno.reduce((total, pagamento) => {
      const valor = Number(pagamento.valor_pago) || 0
      return total + valor
    }, 0)

    return {
      totalDizimistas,
      valorMensalTotal: Number.isNaN(valorMensalTotal) ? 0 : valorMensalTotal,
      totalRecebidoAno: Number.isNaN(totalRecebidoAno) ? 0 : totalRecebidoAno,
      pagamentosEsteAno: pagamentosEsteAno.length,
    }
  })

  return {
    // Estado
    dizimistas: readonly(dizimistas),
    pagamentos: readonly(pagamentos),
    catolicos: readonly(catolicos),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    estatisticas,

    // Métodos
    fetchDizimistas,
    fetchCatolicosDisponiveis,
    fetchPagamentos,
    criarDizimista,
    atualizarDizimista,
    registrarPagamento,
    removerDizimista,
  }
}
