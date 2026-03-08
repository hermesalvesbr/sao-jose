import type {
  PdvCashWithdrawal,
  PdvCategory,
  PdvExpense,
  PdvOperator,
  PdvProduct,
  PdvSale,
  PdvSaleItem,
  PdvSchedule,
} from '~/types/schema'
import { createItem, deleteItem, readItems, updateItem, uploadFiles } from '@directus/sdk'

export function usePdv() {
  const { getAuthClient } = useAuth()
  const loading = ref(false)

  // CATEGORIES
  const fetchCategories = async (query = {}) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(readItems('pdv_categories', query))
    }
    catch (e) {
      console.error('Error fetching categories:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  const createCategory = async (data: Partial<PdvCategory>) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(createItem('pdv_categories', data as any))
    }
    finally {
      loading.value = false
    }
  }

  const updateCategory = async (id: string, data: Partial<PdvCategory>) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(updateItem('pdv_categories', id, data as any))
    }
    finally {
      loading.value = false
    }
  }

  const deleteCategory = async (id: string) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(deleteItem('pdv_categories', id))
    }
    finally {
      loading.value = false
    }
  }

  const fetchCategoriesByPoint = async (pointId: string | null = null) => {
    const query: any = {
      limit: -1,
      sort: ['sort_order'],
      fields: ['*', 'points_id.*'],
    }
    if (pointId) {
      query.filter = { points_id: { _eq: pointId } }
    }
    return fetchCategories(query)
  }

  // PRODUCTS
  const fetchProducts = async (query = {}) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(readItems('pdv_products', query))
    }
    catch (e) {
      console.error('Error fetching products:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  const createProduct = async (data: Partial<PdvProduct>) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(createItem('pdv_products', data as any))
    }
    finally {
      loading.value = false
    }
  }

  const updateProduct = async (id: string, data: Partial<PdvProduct>) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(updateItem('pdv_products', id, data as any))
    }
    finally {
      loading.value = false
    }
  }

  const deleteProduct = async (id: string) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(deleteItem('pdv_products', id))
    }
    finally {
      loading.value = false
    }
  }

  // STOCK MOVEMENTS REMOVED

  // SALES
  const fetchSales = async (query = {}) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(readItems('pdv_sales', query))
    }
    catch (e) {
      console.error('Error fetching sales:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  const createSale = async (data: Partial<PdvSale>) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(createItem('pdv_sales', data as any))
    }
    finally {
      loading.value = false
    }
  }

  const updateSale = async (id: string, data: Partial<PdvSale>) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(updateItem('pdv_sales', id, data as any))
    }
    finally {
      loading.value = false
    }
  }

  // SALE ITEMS
  const fetchSaleItems = async (query = {}) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(readItems('pdv_sale_items', query))
    }
    catch (e) {
      console.error('Error fetching sale items:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  const createSaleItem = async (data: Partial<PdvSaleItem>) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(createItem('pdv_sale_items', data as any))
    }
    finally {
      loading.value = false
    }
  }

  // PRODUCTION POINTS
  const fetchProductionPoints = async (query = {}) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(readItems('pdv_production_points', query))
    }
    catch (e) {
      console.error('Error fetching production points:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  const createProductionPoint = async (data: Record<string, any>) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(createItem('pdv_production_points', data as any))
    }
    finally {
      loading.value = false
    }
  }

  const updateProductionPoint = async (id: string, data: Record<string, any>) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(updateItem('pdv_production_points', id, data as any))
    }
    finally {
      loading.value = false
    }
  }

  const deleteProductionPoint = async (id: string) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(deleteItem('pdv_production_points', id))
    }
    finally {
      loading.value = false
    }
  }

  // OPERATORS
  const fetchOperators = async (query: Record<string, unknown> = {}) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(readItems('pdv_operators', query as any))
    }
    catch (e) {
      console.error('Error fetching operators:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  const createOperator = async (data: Partial<PdvOperator>) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(createItem('pdv_operators', data as any))
    }
    finally {
      loading.value = false
    }
  }

  // EXPENSES
  const fetchExpenses = async (query: Record<string, unknown> = {}) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(readItems('pdv_expenses', query as any))
    }
    catch (e) {
      console.error('Error fetching expenses:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  const createExpense = async (data: Partial<PdvExpense>) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(createItem('pdv_expenses', data as any))
    }
    finally {
      loading.value = false
    }
  }

  const updateExpense = async (id: string | number, data: Partial<PdvExpense>) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(updateItem('pdv_expenses', id, data as any))
    }
    finally {
      loading.value = false
    }
  }

  const deleteExpense = async (id: string | number) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(deleteItem('pdv_expenses', id))
    }
    finally {
      loading.value = false
    }
  }

  // CASH WITHDRAWALS (Sangria de Caixa)
  const fetchCashWithdrawals = async (query: Record<string, unknown> = {}) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(readItems('pdv_cash_withdrawals', query as any))
    }
    catch (e) {
      console.error('Error fetching cash withdrawals:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  const createCashWithdrawal = async (data: Partial<PdvCashWithdrawal>) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(createItem('pdv_cash_withdrawals', data as any))
    }
    finally {
      loading.value = false
    }
  }

  const updateCashWithdrawal = async (id: string, data: Partial<PdvCashWithdrawal>) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(updateItem('pdv_cash_withdrawals', id, data as any))
    }
    finally {
      loading.value = false
    }
  }

  const deleteCashWithdrawal = async (id: string) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(deleteItem('pdv_cash_withdrawals', id))
    }
    finally {
      loading.value = false
    }
  }

  // SCHEDULES (Escala de Voluntários)
  const fetchSchedules = async (query: Record<string, unknown> = {}) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(readItems('pdv_schedules', query as any))
    }
    catch (e) {
      console.error('Error fetching schedules:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  const createSchedule = async (data: Partial<PdvSchedule>) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(createItem('pdv_schedules', data as any))
    }
    finally {
      loading.value = false
    }
  }

  const updateSchedule = async (id: string, data: Partial<PdvSchedule>) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(updateItem('pdv_schedules', id, data as any))
    }
    finally {
      loading.value = false
    }
  }

  const deleteSchedule = async (id: string) => {
    loading.value = true
    try {
      const client = await getAuthClient()
      return await client.request(deleteItem('pdv_schedules', id))
    }
    finally {
      loading.value = false
    }
  }

  // FILE UPLOAD
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const client = await getAuthClient()
      const formData = new FormData()
      formData.append('file', file)
      const result = await client.request(uploadFiles(formData))
      return (result as any)?.id || null
    }
    catch (e) {
      console.error('Error uploading file:', e)
      throw e
    }
  }

  // Asset URL helper
  const getAssetUrl = (fileId: string | null | undefined): string | null => {
    if (!fileId)
      return null
    return getDirectusAssetUrl(fileId)
  }

  return {
    loading,
    fetchCategories,
    fetchCategoriesByPoint,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchSales,
    createSale,
    updateSale,
    fetchSaleItems,
    createSaleItem,
    fetchProductionPoints,
    createProductionPoint,
    updateProductionPoint,
    deleteProductionPoint,
    fetchOperators,
    createOperator,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    uploadFile,
    getAssetUrl,
    fetchCashWithdrawals,
    createCashWithdrawal,
    updateCashWithdrawal,
    deleteCashWithdrawal,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  }
}
