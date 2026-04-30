import pool from '../config/db.js';

const getRevenueForInterval = async (sqlCondition) => {
  const [rows] = await pool.query(
    `
      SELECT COALESCE(SUM(l.quantite * l.prix_unitaire), 0) AS total
      FROM COMMANDE c
      JOIN LIGNE_COMMANDE l ON l.id_commande = c.id_commande
      WHERE c.statut = 'payee' AND ${sqlCondition}
    `
  );

  return Number(rows[0]?.total || 0);
};

export const getDashboardStats = async () => {
  const [statusRows] = await pool.query(`
    SELECT statut, COUNT(*) AS total
    FROM COMMANDE
    GROUP BY statut
  `);

  const [topRows] = await pool.query(`
    SELECT
      l.id_plat,
      COALESCE(p.nom, l.plat_nom) AS nom,
      SUM(l.quantite) AS quantite_totale
    FROM LIGNE_COMMANDE l
    LEFT JOIN PLAT p ON p.id_plat = l.id_plat
    GROUP BY l.id_plat, COALESCE(p.nom, l.plat_nom)
    ORDER BY quantite_totale DESC
    LIMIT 5
  `);

  const [activityRows] = await pool.query(`
    SELECT
      c.id_commande,
      c.statut,
      c.created_at,
      c.updated_at,
      t.numero AS table_numero,
      u.nom AS serveur_nom
    FROM COMMANDE c
    JOIN TABLE_RESTAURANT t ON t.id_table = c.id_table
    JOIN UTILISATEUR u ON u.id_utilisateur = c.id_serveur
    ORDER BY c.updated_at DESC
    LIMIT 8
  `);

  return {
    chiffreAffaires: {
      jour: await getRevenueForInterval('DATE(c.updated_at) = CURDATE()'),
      semaine: await getRevenueForInterval('YEARWEEK(c.updated_at, 1) = YEARWEEK(CURDATE(), 1)'),
      mois: await getRevenueForInterval('YEAR(c.updated_at) = YEAR(CURDATE()) AND MONTH(c.updated_at) = MONTH(CURDATE())')
    },
    commandesParStatut: statusRows,
    topPlats: topRows.map((row) => ({
      ...row,
      quantite_totale: Number(row.quantite_totale)
    })),
    activiteRecente: activityRows
  };
};
