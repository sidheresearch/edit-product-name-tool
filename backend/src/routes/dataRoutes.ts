import { Router } from 'express';
import { DataController } from '../controllers/dataController';
import { validateRequest } from '../middleware/validation';
import { updateRecordSchema, queryParamsSchema } from '../utils/validation';

const router = Router();
const dataController = new DataController();

// GET /api/data - Fetch paginated data with search and filters
router.get('/data', validateRequest(queryParamsSchema), dataController.getData);

// PUT /api/data/:id - Update a single record field
router.put('/data/:id', validateRequest(updateRecordSchema), dataController.updateRecord);

// PUT /api/data/batch - Batch update multiple records
router.put('/data/batch', dataController.batchUpdate);

// GET /api/data/stats - Get table statistics
router.get('/data/stats', dataController.getStats);

export default router;
