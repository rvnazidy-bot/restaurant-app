import { findUserByEmail } from '../models/userModel.js';
import { comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';

export const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    if (user.statut === 'invite') {
      return res.status(403).json({ message: 'Compte invite. Activez votre invitation.' });
    }

    if (!user.actif || user.statut === 'desactive') {
      return res.status(403).json({ message: 'Compte desactive.' });
    }

    const isValid = await comparePassword(mot_de_passe, user.mot_de_passe);
    if (!isValid) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    const token = signToken({
      id: user.id_utilisateur,
      role: user.role,
      nom: user.nom,
      email: user.email
    });

    return res.json({
      token,
      user: {
        id: user.id_utilisateur,
        nom: user.nom,
        email: user.email,
        role: user.role,
        statut: user.statut
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    const message =
      process.env.NODE_ENV === 'development'
        ? error?.message || 'Erreur interne de connexion.'
        : 'Erreur interne de connexion.';
    return res.status(500).json({ message });
  }
};

export const logout = async (_req, res) => res.json({ message: 'Deconnexion effectuee.' });
