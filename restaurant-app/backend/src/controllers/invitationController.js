import { activateUserAccount } from '../models/userModel.js';
import { getInvitationByToken, markInvitationUsed } from '../models/invitationModel.js';
import { hashPassword } from '../utils/password.js';

const serializeInvitationState = (invitation) => {
  if (!invitation) {
    return { status: 'invalid', message: 'Invitation introuvable.' };
  }

  if (invitation.utilise) {
    return { status: 'used', message: 'Invitation deja utilisee.' };
  }

  if (new Date(invitation.expire_le) < new Date()) {
    return { status: 'expired', message: 'Invitation expiree.' };
  }

  return {
    status: 'valid',
    message: 'Invitation valide.',
    user: {
      nom: invitation.nom,
      email: invitation.email,
      role: invitation.role
    }
  };
};

export const verifyInvitation = async (req, res) => {
  try {
    const invitation = await getInvitationByToken(req.params.token);
    return res.json(serializeInvitationState(invitation));
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de verifier cette invitation.' });
  }
};

export const activateInvitation = async (req, res) => {
  try {
    const invitation = await getInvitationByToken(req.params.token);
    const state = serializeInvitationState(invitation);

    if (state.status !== 'valid') {
      return res.status(400).json(state);
    }

    const { mot_de_passe } = req.body;
    if (!mot_de_passe || mot_de_passe.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caracteres.' });
    }

    const passwordHash = await hashPassword(mot_de_passe);
    await activateUserAccount(invitation.id_utilisateur, passwordHash);
    await markInvitationUsed(req.params.token);

    return res.json({ message: 'Compte active avec succes.' });
  } catch (error) {
    return res.status(500).json({ message: 'Impossible d activer ce compte.' });
  }
};
