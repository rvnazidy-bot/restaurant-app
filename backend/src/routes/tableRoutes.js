import { Router } from 'express';
import { createTable, deleteTable, listTables, setTableStatus, updateTable } from '../controllers/tableController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authMiddleware(['admin', 'staff', 'cuisine']), listTables);
router.post('/', authMiddleware(['admin']), createTable);
router.put('/:id', authMiddleware(['admin']), updateTable);
router.put('/:id/statut', authMiddleware(['admin', 'staff']), setTableStatus);
router.delete('/:id', authMiddleware(['admin']), deleteTable);

export default router;
