import { Router } from 'express';
import {
  deleteCommandeLigne,
  deleteCommande,
  getCommande,
  getCommandes,
  postCommande,
  postCommandeLigne,
  putCommande,
  patchCommandeLigne,
  putCommandeStatut
} from '../controllers/commandeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authMiddleware(['admin', 'staff', 'cuisine']), getCommandes);
router.get('/:id', authMiddleware(['admin', 'staff', 'cuisine']), getCommande);
router.post('/', authMiddleware(['staff', 'admin']), postCommande);
router.put('/:id', authMiddleware(['admin', 'staff']), putCommande);
router.put('/:id/statut', authMiddleware(['admin', 'staff', 'cuisine']), putCommandeStatut);
router.post('/:id/lignes', authMiddleware(['staff', 'admin']), postCommandeLigne);
router.patch('/:id/lignes/:lid', authMiddleware(['staff', 'admin']), patchCommandeLigne);
router.delete('/:id/lignes/:lid', authMiddleware(['staff', 'admin']), deleteCommandeLigne);
router.delete('/:id', authMiddleware(['admin', 'staff']), deleteCommande);

export default router;
