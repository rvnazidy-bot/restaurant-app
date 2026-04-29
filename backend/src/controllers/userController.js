import { createInvitation, getLatestInvitationByUserId } from '../models/invitationModel.js';
import { createInvitedUser, findUserById, listUsers, updateUserById, updateUserStatus } from '../models/userModel.js';
import { sendInvitationEmail } from '../services/emailService.js';

const buildInvitationUrl = (token) =>
  `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invitation/${token}`;

export const inviteUser = async (req, res) => {
  try {
    const { nom, email, role } = req.body;
    if (!nom || !email || !role) {
      return res.status(400).json({ message: 'Nom, email et role requis.' });
    }

    const user = await createInvitedUser({ nom, email, role });
    const invitation = await createInvitation(user.id_utilisateur);
    const delivery = await sendInvitationEmail({
      email,
      nom,
      role,
      invitationUrl: buildInvitationUrl(invitation.token)
    });

    return res.status(201).json({
      message: 'Employe invite avec succes.',
      user,
      invitation: {
        token: invitation.token,
        expire_le: invitation.expire_le,
        preview: delivery.preview
      }
    });
  } catch (error) {
    if (String(error.message || '').includes('Duplicate')) {
      return res.status(409).json({ message: 'Cet email existe deja.' });
    }
    return res.status(500).json({ message: 'Impossible d inviter cet employe.' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    const payload = {
      nom: req.body.nom,
      email: req.body.email,
      role: req.body.role
    };

    if (payload.role !== undefined) {
      if (!['admin', 'staff', 'cuisine'].includes(payload.role)) {
        return res.status(400).json({ message: 'Role invalide.' });
      }
    }

    if (payload.email !== undefined) {
      const value = String(payload.email || '').trim();
      if (!value) {
        return res.status(400).json({ message: 'Email invalide.' });
      }
      payload.email = value;
    }

    if (payload.nom !== undefined) {
      const value = String(payload.nom || '').trim();
      if (!value) {
        return res.status(400).json({ message: 'Nom invalide.' });
      }
      payload.nom = value;
    }

    const updated = await updateUserById(req.params.id, payload);
    return res.json(updated);
  } catch (error) {
    if (String(error.message || '').includes('Duplicate')) {
      return res.status(409).json({ message: 'Cet email existe deja.' });
    }
    return res.status(500).json({ message: 'Impossible de modifier cet utilisateur.' });
  }
};

export const getUsers = async (_req, res) => {
  try {
    const users = await listUsers();
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de recuperer le personnel.' });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    const updated = await updateUserStatus(req.params.id, Boolean(req.body.actif));
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de modifier le statut.' });
  }
};

export const resendInvitation = async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    const invitation = await createInvitation(user.id_utilisateur);
    const delivery = await sendInvitationEmail({
      email: user.email,
      nom: user.nom,
      role: user.role,
      invitationUrl: buildInvitationUrl(invitation.token)
    });

    const latestInvitation = await getLatestInvitationByUserId(user.id_utilisateur);
    return res.json({
      message: 'Invitation renvoyee.',
      invitation: latestInvitation,
      preview: delivery.preview
    });
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de renvoyer l invitation.' });
  }
};
