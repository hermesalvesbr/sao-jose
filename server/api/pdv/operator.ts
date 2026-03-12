import type { PdvOperator } from '~/types/schema'
import { createItem, readItems, updateItem } from '@directus/sdk'
import { titleCase } from '~/utils/normalize-text'

interface OperatorRequest {
  name: string
}

interface OperatorResponse {
  id: string
  name: string
  isNew?: boolean
}

type OperatorRecord = Pick<PdvOperator, 'id' | 'name' | 'active'>

const MULTI_SPACE_RE = /\s+/g

function normalizeOperatorName(value: string): string {
  return titleCase(value.trim().replace(MULTI_SPACE_RE, ' '))
}

export default defineEventHandler(async (event): Promise<OperatorResponse | null> => {
  const method = getMethod(event)

  // GET /api/pdv/operator?name=... — lookup only, no side effects
  if (method === 'GET') {
    const { name } = getQuery(event)
    if (!name || typeof name !== 'string')
      throw createError({ statusCode: 400, statusMessage: 'Informe o nome.' })

    const normalized = normalizeOperatorName(name)
    const parts = normalized.split(' ').filter(Boolean)
    if (parts.length < 2)
      return null

    const client = createServerDirectusClient(event)
    const existing = await client.request(
      readItems('pdv_operators', {
        fields: ['id', 'name', 'active'],
        filter: { name: { _eq: normalized } },
        limit: 1,
      }),
    ) as OperatorRecord[]

    if (existing.length === 0)
      return null

    const operator = existing[0]!
    return { id: operator.id, name: operator.name }
  }

  // POST /api/pdv/operator — upsert
  assertMethod(event, 'POST')
  const body = await readBody<OperatorRequest>(event)

  if (!body || typeof body !== 'object' || !body.name)
    throw createError({ statusCode: 400, statusMessage: 'Informe o nome do operador.' })

  const normalized = normalizeOperatorName(body.name)
  const parts = normalized.split(' ').filter(Boolean)

  if (parts.length < 2)
    throw createError({ statusCode: 400, statusMessage: 'Informe nome e sobrenome do operador.' })

  const client = createServerDirectusClient(event)

  const existing = await client.request(
    readItems('pdv_operators', {
      fields: ['id', 'name', 'active'],
      filter: { name: { _eq: normalized } },
      limit: 1,
    }),
  ) as OperatorRecord[]

  if (existing.length > 0) {
    const operator = existing[0]!

    if (!operator.active)
      await client.request(updateItem('pdv_operators', operator.id, { active: true }))

    return { id: operator.id, name: operator.name, isNew: false }
  }

  const created = await client.request(createItem('pdv_operators', {
    name: normalized,
    active: true,
    status: 'published',
  }))

  return { id: created.id, name: normalized, isNew: true }
})
