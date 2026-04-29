import { Router } from 'express';
import { activateInvitation, verifyInvitation } from '../controllers/invitationController.js';

const router = Router();

router.get('/:token', verifyInvitation);
router.post('/:token', activateInvitation);

export default router;
