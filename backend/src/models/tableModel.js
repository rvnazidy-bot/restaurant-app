import pool from '../config/db.js';

export const getTables = async () => {
  const [rows] = await pool.query(`
    SELECT
      t.*,
      c.id_commande AS commande_active_id,
      c.statut AS commande_active_statut,
      c.created_at AS commande_active_created_at
    FROM TABLE_RESTAURANT t
    LEFT JOIN COMMANDE c
      ON c.id_table = t.id_table
      AND c.id_commande = (
        SELECT c2.id_commande
        FROM COMMANDE c2
        WHERE c2.id_table = t.id_table AND c2.statut <> 'payee'
        ORDER BY c2.created_at DESC
        LIMIT 1
      )
    ORDER BY t.numero ASC
  `);
  return rows;
};

export const getTableById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM TABLE_RESTAURANT WHERE id_table = ? LIMIT 1', [id]);
  return rows[0] || null;
};

export const updateTableStatus = async (id, statut) => {
  await pool.query('UPDATE TABLE_RESTAURANT SET statut = ? WHERE id_table = ?', [statut, id]);
  return getTableById(id);
};

export const createTable = async ({ numero, capacite, statut }) => {
  const n = Number(numero);
  const c = Number(capacite);
  const s = statut || 'libre';

  const [result] = await pool.query(
    'INSERT INTO TABLE_RESTAURANT (numero, capacite, statut) VALUES (?, ?, ?)',
    [n, c, s]
  );
  return getTableById(result.insertId);
};

export const updateTable = async (id, { numero, capacite, statut }) => {
  const fields = [];
  const params = [];

  if (numero !== undefined) {
    fields.push('numero = ?');
    params.push(Number(numero));
  }

  if (capacite !== undefined) {
    fields.push('capacite = ?');
    params.push(Number(capacite));
  }

  if (statut !== undefined) {
    fields.push('statut = ?');
    params.push(statut);
  }

  if (!fields.length) {
    return getTableById(id);
  }

  params.push(id);
  await pool.query(`UPDATE TABLE_RESTAURANT SET ${fields.join(', ')} WHERE id_table = ?`, params);
  return getTableById(id);
};

export const getActiveCommandeForTable = async (tableId) => {
  const [rows] = await pool.query(
    'SELECT id_commande, statut FROM COMMANDE WHERE id_table = ? AND statut <> "payee" ORDER BY created_at DESC LIMIT 1',
    [tableId]
  );
  return rows?.[0] || null;
};

export const deleteTableById = async (id) => {
  const [result] = await pool.query('DELETE FROM TABLE_RESTAURANT WHERE id_table = ?', [id]);
  return result?.affectedRows ? true : false;
};
