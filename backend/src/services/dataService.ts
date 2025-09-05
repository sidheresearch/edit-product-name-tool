import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GetDataParams {
  page: number;
  pageSize: number;
  search?: string;
  true_importer_name?: string;
  origin_country?: string;
  city?: string;
  indian_port?: string;
  hs_code?: string;
  chapter?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface UpdateRequest {
  id: string;
  field: string;
  value: any;
}

export class DataService {
  async getData(params: GetDataParams) {
    const {
      page,
      pageSize,
      search,
      true_importer_name,
      origin_country,
      city,
      indian_port,
      hs_code,
      chapter,
      sortBy = 'target_date',
      sortOrder = 'desc',
      startDate,
      endDate
    } = params;

    // Build where clause for filtering
    const where: any = {};

    // Search filter - searches across multiple text fields
    if (search) {
      where.OR = [
        { unique_product_name: { contains: search, mode: 'insensitive' } },
        { true_importer_name: { contains: search, mode: 'insensitive' } },
        { product_name: { contains: search, mode: 'insensitive' } },
        { supplier_name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { origin_country: { contains: search, mode: 'insensitive' } },
        { indian_port: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Specific filters
    if (true_importer_name) {
      where.true_importer_name = { contains: true_importer_name, mode: 'insensitive' };
    }

    if (origin_country) {
      where.origin_country = { contains: origin_country, mode: 'insensitive' };
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (indian_port) {
      where.indian_port = { contains: indian_port, mode: 'insensitive' };
    }

    if (hs_code) {
      where.hs_code = parseInt(hs_code);
    }

    if (chapter) {
      where.chapter = parseInt(chapter);
    }

    // Date range filter
    if (startDate || endDate) {
      where.reg_date = {};
      if (startDate) {
        where.reg_date.gte = new Date(startDate);
      }
      if (endDate) {
        where.reg_date.lte = new Date(endDate);
      }
    }

    // ALWAYS filter to show only records where unique_product_name is null or empty
    // This ensures only editable records are returned
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { unique_product_name: null },
          { unique_product_name: '' }
        ]
      }
    ];

    console.log('Applied automatic filter for null/empty unique_product_name');

    // Calculate offset
    const skip = (page - 1) * pageSize;

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Execute queries in parallel
    const [data, totalCount] = await Promise.all([
      prisma.productIcegateImport.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        select: {
          system_id: true,
          reg_date: true,
          month_year: true,
          hs_code: true,
          unique_product_name: true,
          true_importer_name: true,
          product_name: true,
        },
      }),
      prisma.productIcegateImport.count({ where }),
    ]);

    return {
      data,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  async updateRecord(id: string, field: string, value: any) {
    // Only allow updating unique_product_name field
    if (field !== 'unique_product_name') {
      throw new Error(`Field '${field}' is not updatable. Only 'unique_product_name' can be updated.`);
    }

    const updateData: any = {};
    updateData[field] = value;

    // Convert id to number since system_id is an integer
    const systemId = parseInt(id);
    if (isNaN(systemId)) {
      throw new Error('Invalid system_id provided');
    }

    // First, find the record by system_id to get the composite key
    const existingRecord = await prisma.productIcegateImport.findFirst({
      where: { system_id: systemId }
    });

    if (!existingRecord) {
      throw new Error(`Record with system_id ${systemId} not found`);
    }

    // Now update using the composite primary key
    const updatedRecord = await prisma.productIcegateImport.update({
      where: {
        system_id_reg_date_month_year_hs_code: {
          system_id: existingRecord.system_id,
          reg_date: existingRecord.reg_date,
          month_year: existingRecord.month_year,
          hs_code: existingRecord.hs_code
        }
      },
      data: updateData,
    });

    return updatedRecord;
  }

  async batchUpdate(updates: UpdateRequest[]) {
    const results: any[] = [];

    // Process updates in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      const batchPromises = batch.map(update => 
        this.updateRecord(update.id, update.field, update.value)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  async getStats() {
    const [totalRecords, lastRecord] = await Promise.all([
      prisma.productIcegateImport.count(),
      prisma.productIcegateImport.findFirst({
        orderBy: { target_date: 'desc' },
        select: { target_date: true },
      }),
    ]);

    return {
      totalRecords,
      lastUpdated: lastRecord?.target_date?.toISOString() || new Date().toISOString(),
    };
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}
