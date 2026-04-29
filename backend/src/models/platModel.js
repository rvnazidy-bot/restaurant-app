import pool from '../config/db.js';

export const getPlats = async () => {
  const [rows] = await pool.query(`
    SELECT
      p.*,
      c.nom AS categorie_nom,
      c.ordre AS categorie_ordre
    FROM PLAT p
    JOIN CATEGORIE c ON c.id_categorie = p.id_categorie
    ORDER BY c.ordre ASC, p.nom ASC
  `);
  return rows;
};

export const getPlatById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM PLAT WHERE id_plat = ? LIMIT 1', [id]);
  return rows[0] || null;
};

export const createPlat = async (payload) => {
  const { id_categorie, nom, description, prix, image_url, disponible } = payload;
  const [result] = await pool.query(
    `
      INSERT INTO PLAT (id_categorie, nom, description, prix, image_url, disponible)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [id_categorie, nom, description, prix, image_url, disponible ? 1 : 0]
  );
  return getPlatById(result.insertId);
};

export const updatePlat = async (id, payload) => {
  const { id_categorie, nom, description, prix, image_url, disponible } = payload;
  await pool.query(
    `
      UPDATE PLAT
      SET id_categorie = ?, nom = ?, description = ?, prix = ?, image_url = ?, disponible = ?
      WHERE id_plat = ?
    `,
    [id_categorie, nom, description, prix, image_url, disponible ? 1 : 0, id]
  );
  return getPlatById(id);
};

export const updatePlatDisponibilite = async (id, disponible) => {
  await pool.query('UPDATE PLAT SET disponible = ? WHERE id_plat = ?', [disponible ? 1 : 0, id]);
  return getPlatById(id);
};

export const deletePlat = async (id) => {
  await pool.query('DELETE FROM PLAT WHERE id_plat = ?', [id]);
};
