// Optimized interface for list view - only includes fields returned by API
export interface ProductIcegateImportListItem {
  system_id: number
  hs_code: number | null
  unique_product_name: string | null
  true_importer_name: string | null
  product_name: string | null
}

// Full interface for complete product import data (for updates, etc.)
export interface ProductIcegateImport {
  system_id: number | null
  reg_date: string | null
  month_year: string | null
  hs_code: number | null
  chapter: number | null
  unique_product_name: string | null
  quantity: number | null
  unit_quantity: string | null
  unit_price_usd: number | null
  total_value_usd: number | null
  importer_id: string | null
  true_importer_name: string | null
  city: string | null
  cha_number: string | null
  type: string | null
  true_supplier_name: string | null
  indian_port: string | null
  foreign_port: string | null
  origin_country: string | null
  exchange_rate_usd: number | null
  duty: number | null
  product_name: string | null
  supplier_name: string | null
  supplier_address: string | null
  target_date: string | null
  id: string
  importer: string | null
}

// Type alias for backward compatibility
export type DataRecord = ProductIcegateImport

export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface DataFilters {
  search?: string
  true_importer_name?: string
  origin_country?: string
  city?: string
  indian_port?: string
  hs_code?: string
  chapter?: string
  startDate?: string
  endDate?: string
}

export interface UpdateRecordRequest {
  id: string
  field: 'unique_product_name' // Only allow updating this field
  value: string | null
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
