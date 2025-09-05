import { Request, Response } from 'express';
import { DataService } from '../services/dataService';

export class DataController {
  private dataService: DataService;

  constructor() {
    this.dataService = new DataService();
  }

  // GET /api/data
  getData = async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        pageSize = 50,
        search = '',
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
      } = req.query as any;

      const result = await this.dataService.getData({
        page: Number(page),
        pageSize: Number(pageSize),
        search: String(search),
        true_importer_name: true_importer_name as string,
        origin_country: origin_country as string,
        city: city as string,
        indian_port: indian_port as string,
        hs_code: hs_code as string,
        chapter: chapter as string,
        sortBy: String(sortBy),
        sortOrder: sortOrder as 'asc' | 'desc',
        startDate: startDate as string,
        endDate: endDate as string
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch data'
      });
    }
  };

  // PUT /api/data/:id
  updateRecord = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { field, value } = req.body;

      const result = await this.dataService.updateRecord(
        String(id),
        field,
        value
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update record'
      });
    }
  };

  // PUT /api/data/batch
  batchUpdate = async (req: Request, res: Response) => {
    try {
      const { updates } = req.body;

      const result = await this.dataService.batchUpdate(updates);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to perform batch update'
      });
    }
  };

  // GET /api/data/stats
  getStats = async (req: Request, res: Response) => {
    try {
      const stats = await this.dataService.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch statistics'
      });
    }
  };
}
