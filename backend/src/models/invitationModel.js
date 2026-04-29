import crypto from 'crypto';
import pool from '../config/db.js';

export const createInvitation = async (userId) => {
  const token = crypto.randomBytes(24).toString('hex');
  await pool.query('UPDATE invitation SET utilise = 1 WHERE id_utilisateur = ? AND utilise = 0', [userId]);
  await pool.query(
    'INSERT INTO invitation (id_utilisateur, token, expire_le, utilise) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), 0)',
    [userId, token]
  );
  return getInvitationByToken(token);
};

export const getInvitationByToken = async (token) => {
  const [rows] = await pool.query(
    `
      SELECT
        i.*,
        u.nom,
        u.email,
        u.role,
        u.statut AS user_statut
      FROM invitation i
      JOIN utilisateur u ON u.id_utilisateur = i.id_utilisateur
      WHERE i.token = ?
      LIMIT 1
    `,
    [token]
  );

  return rows[0] || null;
};

export const markInvitationUsed = async (token) => {
  await pool.query('UPDATE invitation SET utilise = 1 WHERE token = ?', [token]);
};

export const getLatestInvitationByUserId = async (userId) => {
  const [rows] = await pool.query(
    'SELECT * FROM invitation WHERE id_utilisateur = ? ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  return rows[0] || null;
};
