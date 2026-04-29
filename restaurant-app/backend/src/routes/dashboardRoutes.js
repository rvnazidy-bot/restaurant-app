import { Router } from 'express';
import { stats } from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/stats', authMiddleware(['admin']), stats);

export default router;
