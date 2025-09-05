import axios from 'axios'
import { ProductIcegateImport, ProductIcegateImportListItem, PaginatedResponse, DataFilters, UpdateRecordRequest, ApiResponse } from '../types'

// Determine API URL based on environment
const getApiUrl = () => {
  // Check if we're in production
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://meghamam-2.onrender.com/api'
  }
  // Development
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
}

const API_BASE_URL = getApiUrl()

console.log('API Base URL:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for production
})

export interface FetchDataParams {
  page?: number
  pageSize?: number
  search?: string
  filters?: DataFilters
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const dataService = {
  // Fetch paginated data with search and filters
  async fetchData(params: FetchDataParams = {}): Promise<PaginatedResponse<ProductIcegateImportListItem>> {
    const {
      page = 1,
      pageSize = 50,
      search = '',
      filters = {},
      sortBy = 'target_date',
      sortOrder = 'desc'
    } = params

    const response = await api.get<ApiResponse<PaginatedResponse<ProductIcegateImportListItem>>>('/data', {
      params: {
        page,
        pageSize,
        search,
        sortBy,
        sortOrder,
        ...filters
      }
    })

    return response.data.data
  },

  // Update unique_product_name field only
  async updateRecord(request: UpdateRecordRequest): Promise<ProductIcegateImport> {
    const response = await api.put<ApiResponse<ProductIcegateImport>>(`/data/${request.id}`, {
      field: request.field,
      value: request.value
    })

    return response.data.data
  },

  // Get table statistics
  async getTableStats(): Promise<{ totalRecords: number; lastUpdated: string }> {
    const response = await api.get<ApiResponse<{ totalRecords: number; lastUpdated: string }>>('/data/stats')
    return response.data.data
  },

  // Batch update multiple records (unique_product_name only)
  async batchUpdate(updates: UpdateRecordRequest[]): Promise<ProductIcegateImport[]> {
    const response = await api.put<ApiResponse<ProductIcegateImport[]>>('/data/batch', { updates })
    return response.data.data
  }
}

export default dataService
