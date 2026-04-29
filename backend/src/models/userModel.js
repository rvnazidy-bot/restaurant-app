import pool from '../config/db.js';

export const findUserByEmail = async (email) => {
  const result = await pool.get('SELECT * FROM UTILISATEUR WHERE email = ? LIMIT 1', [email]);
  return result || null;
};

export const findUserById = async (id) => {
  const result = await pool.get(
    'SELECT id_utilisateur, nom, email, role, statut, actif, created_at FROM UTILISATEUR WHERE id_utilisateur = ? LIMIT 1',
    [id]
  );
  return result || null;
};

export const listUsers = async () => {
  const rows = await pool.all(`
    SELECT
      u.id_utilisateur,
      u.nom,
      u.email,
      u.role,
      u.statut,
      u.actif,
      u.created_at,
      i.token AS invitation_token,
      i.expire_le,
      i.utilise
    FROM UTILISATEUR u
    LEFT JOIN INVITATION i
      ON i.id_utilisateur = u.id_utilisateur
      AND i.id_invitation = (
        SELECT id_invitation
        FROM INVITATION i2
        WHERE i2.id_utilisateur = u.id_utilisateur
        ORDER BY i2.created_at DESC
        LIMIT 1
      )
    ORDER BY
      CASE u.role
        WHEN 'admin' THEN 1
        WHEN 'staff' THEN 2
        WHEN 'cuisine' THEN 3
        ELSE 4
      END,
      u.nom ASC
  `);
  return rows;
};

export const createInvitedUser = async ({ nom, email, role }) => {
  const result = await pool.run(
    'INSERT INTO UTILISATEUR (nom, email, role, statut, actif, mot_de_passe) VALUES (?, ?, ?, "invite", 1, NULL)',
    [nom, email, role]
  );

  return findUserById(result.lastID);
};

export const updateUserStatus = async (id, actif) => {
  const statut = actif ? 'actif' : 'desactive';
  await pool.run('UPDATE UTILISATEUR SET actif = ?, statut = ? WHERE id_utilisateur = ?', [
    actif ? 1 : 0,
    statut,
    id
  ]);
  return findUserById(id);
};

export const updateUserById = async (id, { nom, email, role }) => {
  const fields = [];
  const params = [];

  if (nom !== undefined) {
    fields.push('nom = ?');
    params.push(nom);
  }

  if (email !== undefined) {
    fields.push('email = ?');
    params.push(email);
  }

  if (role !== undefined) {
    fields.push('role = ?');
    params.push(role);
  }

  if (!fields.length) {
    return findUserById(id);
  }

  params.push(id);
  await pool.run(`UPDATE UTILISATEUR SET ${fields.join(', ')} WHERE id_utilisateur = ?`, params);
  return findUserById(id);
};

export const activateUserAccount = async (id, passwordHash) => {
  await pool.run(
    'UPDATE UTILISATEUR SET mot_de_passe = ?, statut = "actif", actif = 1 WHERE id_utilisateur = ?',
    [passwordHash, id]
  );
  return findUserById(id);
};
