import { Router } from 'express';
import { getSummary, recordSession } from '../controllers/performanceController.js';

const router = Router();

router.get('/summary', getSummary);
router.post('/', recordSession);

export default router;
