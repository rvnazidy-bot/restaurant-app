import { Router } from 'express';
import { getUsers, inviteUser, resendInvitation, toggleUserStatus, updateUser } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/inviter', authMiddleware(['admin']), inviteUser);
router.get('/', authMiddleware(['admin']), getUsers);
router.put('/:id', authMiddleware(['admin']), updateUser);
router.put('/:id/statut', authMiddleware(['admin']), toggleUserStatus);
router.post('/renvoyer-invitation/:id', authMiddleware(['admin']), resendInvitation);

export default router;
