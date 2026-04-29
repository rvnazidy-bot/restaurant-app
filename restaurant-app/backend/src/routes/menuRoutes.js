import { Router } from 'express';
import {
  listCategories,
  listPlats,
  patchPlatDisponibilite,
  postCategory,
  postPlat,
  putCategory,
  putPlat,
  removeCategory,
  removePlat
} from '../controllers/menuController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/categories', authMiddleware(['admin', 'staff']), listCategories);
router.post('/categories', authMiddleware(['admin']), postCategory);
router.put('/categories/:id', authMiddleware(['admin']), putCategory);
router.delete('/categories/:id', authMiddleware(['admin']), removeCategory);

router.get('/plats', authMiddleware(['admin', 'staff']), listPlats);
router.post('/plats', authMiddleware(['admin']), postPlat);
router.put('/plats/:id', authMiddleware(['admin']), putPlat);
router.patch('/plats/:id/disponibilite', authMiddleware(['admin']), patchPlatDisponibilite);
router.delete('/plats/:id', authMiddleware(['admin']), removePlat);

export default router;
