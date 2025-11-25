import { Router } from 'express';
import { listPapers, getPaper } from '../controllers/paperController.js';

const router = Router();

router.get('/', listPapers);
router.get('/:paperId', getPaper);

export default router;
