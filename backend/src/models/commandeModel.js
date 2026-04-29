import pool from '../config/db.js';

const mapCommande = (row) => ({
  ...row,
  total: Number(row.total || 0)
});

export const listCommandes = async ({ role, statut, date, table, scope }) => {
  const conditions = [];
  const params = [];

  if (role === 'staff' && scope !== 'history') {
    conditions.push(`c.statut IN ('en_attente', 'en_preparation', 'servie')`);
  }

  if (role === 'cuisine') {
    conditions.push(`c.statut IN ('en_attente', 'en_preparation', 'servie')`);
  }

  if (scope === 'history') {
    conditions.push(`c.statut = 'payee' OR c.statut IN ('en_attente', 'en_preparation', 'servie')`);
  }

  if (statut) {
    conditions.push('c.statut = ?');
    params.push(statut);
  }

  if (date) {
    conditions.push('DATE(c.created_at) = ?');
    params.push(date);
  }

  if (table) {
    conditions.push('t.numero = ?');
    params.push(table);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = role === 'cuisine' ? 'ORDER BY c.created_at ASC' : 'ORDER BY c.created_at DESC';

  const [rows] = await pool.query(
    `
      SELECT
        c.id_commande,
        c.id_table,
        c.id_serveur,
        c.statut,
        c.created_at,
        c.updated_at,
        t.numero AS table_numero,
        u.nom AS serveur_nom,
        COUNT(l.id_ligne) AS nombre_lignes,
        COALESCE(SUM(l.quantite * l.prix_unitaire), 0) AS total
      FROM COMMANDE c
      JOIN TABLE_RESTAURANT t ON t.id_table = c.id_table
      JOIN UTILISATEUR u ON u.id_utilisateur = c.id_serveur
      LEFT JOIN LIGNE_COMMANDE l ON l.id_commande = c.id_commande
      ${where}
      GROUP BY c.id_commande
      ${orderBy}
    `,
    params
  );

  const commandes = rows.map(mapCommande);

  if (role === 'cuisine' && commandes.length) {
    const ids = commandes.map((c) => c.id_commande);
    const placeholders = ids.map(() => '?').join(',');
    const [lineRows] = await pool.query(
      `
        SELECT
          l.id_ligne,
          l.id_commande,
          l.id_plat,
          l.quantite,
          l.prix_unitaire,
          l.notes,
          p.nom AS plat_nom,
          p.image_url
        FROM LIGNE_COMMANDE l
        JOIN PLAT p ON p.id_plat = l.id_plat
        WHERE l.id_commande IN (${placeholders})
        ORDER BY l.id_commande ASC, l.id_ligne ASC
      `,
      ids
    );

    const linesByCommande = new Map();
    for (const row of lineRows) {
      const list = linesByCommande.get(row.id_commande) || [];
      list.push({
        ...row,
        prix_unitaire: Number(row.prix_unitaire)
      });
      linesByCommande.set(row.id_commande, list);
    }

    return commandes.map((commande) => ({
      ...commande,
      lignes: linesByCommande.get(commande.id_commande) || []
    }));
  }

  return commandes;
};

export const getCommandeById = async (id) => {
  const [commandRows] = await pool.query(
    `
      SELECT
        c.id_commande,
        c.id_table,
        c.id_serveur,
        c.statut,
        c.created_at,
        c.updated_at,
        t.numero AS table_numero,
        u.nom AS serveur_nom,
        COALESCE(SUM(l.quantite * l.prix_unitaire), 0) AS total
      FROM COMMANDE c
      JOIN TABLE_RESTAURANT t ON t.id_table = c.id_table
      JOIN UTILISATEUR u ON u.id_utilisateur = c.id_serveur
      LEFT JOIN LIGNE_COMMANDE l ON l.id_commande = c.id_commande
      WHERE c.id_commande = ?
      GROUP BY c.id_commande
    `,
    [id]
  );

  if (!commandRows[0]) {
    return null;
  }

  const [lineRows] = await pool.query(
    `
      SELECT
        l.*,
        p.nom AS plat_nom,
        p.image_url
      FROM LIGNE_COMMANDE l
      JOIN PLAT p ON p.id_plat = l.id_plat
      WHERE l.id_commande = ?
      ORDER BY l.id_ligne ASC
    `,
    [id]
  );

  return {
    ...mapCommande(commandRows[0]),
    lignes: lineRows.map((row) => ({
      ...row,
      prix_unitaire: Number(row.prix_unitaire)
    }))
  };
};

export const createCommande = async ({ id_table, id_serveur, lignes }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [commandeResult] = await connection.query(
      'INSERT INTO COMMANDE (id_table, id_serveur, statut) VALUES (?, ?, "en_attente")',
      [id_table, id_serveur]
    );

    for (const ligne of lignes) {
      await connection.query(
        `
          INSERT INTO LIGNE_COMMANDE (id_commande, id_plat, quantite, prix_unitaire, notes)
          VALUES (?, ?, ?, ?, ?)
        `,
        [commandeResult.insertId, ligne.id_plat, ligne.quantite, ligne.prix_unitaire, ligne.notes || null]
      );
    }

    await connection.query('UPDATE TABLE_RESTAURANT SET statut = "occupee" WHERE id_table = ?', [id_table]);
    await connection.commit();

    return getCommandeById(commandeResult.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateCommandeStatut = async (id, statut) => {
  await pool.query('UPDATE COMMANDE SET statut = ? WHERE id_commande = ?', [statut, id]);

  if (statut === 'payee') {
    const commande = await getCommandeById(id);
    if (commande) {
      await pool.query('UPDATE TABLE_RESTAURANT SET statut = "libre" WHERE id_table = ?', [commande.id_table]);
    }
  }

  return getCommandeById(id);
};

export const addLigneToCommande = async (commandeId, { id_plat, quantite, prix_unitaire, notes }) => {
  const [result] = await pool.query(
    `
      INSERT INTO LIGNE_COMMANDE (id_commande, id_plat, quantite, prix_unitaire, notes)
      VALUES (?, ?, ?, ?, ?)
    `,
    [commandeId, id_plat, quantite, prix_unitaire, notes || null]
  );

  return result.insertId;
};

export const deleteLigneFromCommande = async (commandeId, ligneId) => {
  await pool.query('DELETE FROM LIGNE_COMMANDE WHERE id_commande = ? AND id_ligne = ?', [commandeId, ligneId]);
};

export const updateCommande = async (id, { id_table }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query('SELECT id_commande, id_table, statut FROM COMMANDE WHERE id_commande = ? LIMIT 1', [id]);
    const existing = existingRows?.[0];
    if (!existing) {
      await connection.rollback();
      return null;
    }

    if (id_table != null && Number(id_table) !== Number(existing.id_table)) {
      const [activeOther] = await connection.query(
        'SELECT id_commande FROM COMMANDE WHERE id_table = ? AND statut <> "payee" AND id_commande <> ? LIMIT 1',
        [id_table, id]
      );
      if (activeOther?.length) {
        await connection.rollback();
        const err = new Error('Table occupee.');
        err.code = 'TABLE_OCCUPEE';
        throw err;
      }

      await connection.query('UPDATE COMMANDE SET id_table = ?, updated_at = NOW() WHERE id_commande = ?', [id_table, id]);

      if (existing.statut !== 'payee') {
        await connection.query('UPDATE TABLE_RESTAURANT SET statut = "libre" WHERE id_table = ?', [existing.id_table]);
        await connection.query('UPDATE TABLE_RESTAURANT SET statut = "occupee" WHERE id_table = ?', [id_table]);
      }
    }

    await connection.commit();
    return getCommandeById(id);
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // ignore
    }
    throw error;
  } finally {
    connection.release();
  }
};

export const updateCommandeLigne = async (commandeId, ligneId, { quantite, notes }) => {
  const [rows] = await pool.query(
    'SELECT id_ligne FROM LIGNE_COMMANDE WHERE id_commande = ? AND id_ligne = ? LIMIT 1',
    [commandeId, ligneId]
  );
  if (!rows?.[0]) return null;

  const sets = [];
  const params = [];

  if (quantite !== undefined) {
    sets.push('quantite = ?');
    params.push(quantite);
  }

  if (notes !== undefined) {
    sets.push('notes = ?');
    params.push(notes);
  }

  if (!sets.length) return null;

  params.push(commandeId, ligneId);
  await pool.query(
    `UPDATE LIGNE_COMMANDE SET ${sets.join(', ')} WHERE id_commande = ? AND id_ligne = ?`,
    params
  );

  return true;
};

export const deleteCommandeById = async (id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT id_commande, id_table, statut FROM COMMANDE WHERE id_commande = ? LIMIT 1',
      [id]
    );
    const commande = rows?.[0];
    if (!commande) {
      await connection.rollback();
      return false;
    }

    await connection.query('DELETE FROM COMMANDE WHERE id_commande = ?', [id]);

    if (commande.statut !== 'payee') {
      const [stillActive] = await connection.query(
        'SELECT id_commande FROM COMMANDE WHERE id_table = ? AND statut <> "payee" LIMIT 1',
        [commande.id_table]
      );
      if (!stillActive?.length) {
        await connection.query('UPDATE TABLE_RESTAURANT SET statut = "libre" WHERE id_table = ?', [commande.id_table]);
      }
    }

    await connection.commit();
    return true;
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // ignore
    }
    throw error;
  } finally {
    connection.release();
  }
};
