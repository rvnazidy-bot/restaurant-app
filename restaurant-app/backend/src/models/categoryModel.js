import pool from '../config/db.js';

export const getCategories = async () => {
  const [rows] = await pool.query(
    'SELECT * FROM categorie ORDER BY ordre ASC, nom ASC'
  );
  return rows;
};

export const createCategory = async ({ nom, ordre }) => {
  const [result] = await pool.query('INSERT INTO categorie (nom, ordre) VALUES (?, ?)', [nom, ordre]);
  const [rows] = await pool.query('SELECT * FROM categorie WHERE id_categorie = ?', [result.insertId]);
  return rows[0];
};

export const updateCategory = async (id, { nom, ordre }) => {
  await pool.query('UPDATE categorie SET nom = ?, ordre = ? WHERE id_categorie = ?', [nom, ordre, id]);
  const [rows] = await pool.query('SELECT * FROM categorie WHERE id_categorie = ?', [id]);
  return rows[0] || null;
};

export const deleteCategory = async (id) => {
  await pool.query('DELETE FROM categorie WHERE id_categorie = ?', [id]);
};
