import { z } from 'zod';

// Schema for query parameters (GET /api/data)
export const queryParamsSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).optional(),
    pageSize: z.string().transform(Number).optional(),
    search: z.string().optional(),
    true_importer_name: z.string().optional(),
    origin_country: z.string().optional(),
    city: z.string().optional(),
    indian_port: z.string().optional(),
    hs_code: z.string().optional(),
    chapter: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
});

// Schema for updating a record - only allow unique_product_name
export const updateRecordSchema = z.object({
  body: z.object({
    field: z.literal('unique_product_name'),
    value: z.string().nullable(),
  }),
  params: z.object({
    id: z.string(),
  })
});

// Schema for batch updates
export const batchUpdateSchema = z.object({
  body: z.object({
    updates: z.array(z.object({
      id: z.string(),
      field: z.literal('unique_product_name'),
      value: z.string().nullable(),
    }))
  })
});

export type QueryParams = z.infer<typeof queryParamsSchema>;
export type UpdateRecordRequest = z.infer<typeof updateRecordSchema>;
export type BatchUpdateRequest = z.infer<typeof batchUpdateSchema>;
