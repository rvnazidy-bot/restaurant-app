import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Créer la connexion SQLite
// Wrapper pour maintenir l'interface promise-based
const pool = {
  query: (sql, params = []) => mysqlPool.query(sql, params),
  getConnection: () => mysqlPool.getConnection(),
  get: async (sql, params = []) => {
    const [rows] = await mysqlPool.query(sql, params);
    return rows?.[0] ?? null;
  },
  all: async (sql, params = []) => {
    const [rows] = await mysqlPool.query(sql, params);
    return rows;
  },
  run: async (sql, params = []) => {
    const [result] = await mysqlPool.query(sql, params);
    return {
      lastID: result?.insertId ?? null,
      changes: result?.affectedRows ?? 0
    };
  },
  exec: async (sql) => {
    await mysqlPool.query(sql);
  }
};

export default pool;
