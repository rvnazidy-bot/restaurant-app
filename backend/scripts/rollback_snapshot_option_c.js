import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const requiredEnv = ['DB_HOST', 'DB_NAME', 'DB_USER'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing env var: ${key}`);
    process.exit(1);
  }
}

const connectionConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true
};

const getColumnExists = async (conn, table, column) => {
  const [rows] = await conn.query(
    `
      SELECT 1 AS ok
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [process.env.DB_NAME, table, column]
  );
  return rows.length > 0;
};

const getFkToPlat = async (conn) => {
  const [rows] = await conn.query(
    `
      SELECT kcu.CONSTRAINT_NAME AS constraint_name
      FROM information_schema.KEY_COLUMN_USAGE kcu
      WHERE kcu.TABLE_SCHEMA = ?
        AND kcu.TABLE_NAME = 'LIGNE_COMMANDE'
        AND kcu.COLUMN_NAME = 'id_plat'
        AND kcu.REFERENCED_TABLE_NAME = 'PLAT'
      LIMIT 1
    `,
    [process.env.DB_NAME]
  );
  return rows[0]?.constraint_name || null;
};

const getFkDeleteRule = async (conn, constraintName) => {
  const [rows] = await conn.query(
    `
      SELECT rc.DELETE_RULE AS delete_rule
      FROM information_schema.REFERENTIAL_CONSTRAINTS rc
      WHERE rc.CONSTRAINT_SCHEMA = ? AND rc.CONSTRAINT_NAME = ?
      LIMIT 1
    `,
    [process.env.DB_NAME, constraintName]
  );
  return rows[0]?.delete_rule || null;
};

const run = async () => {
  const conn = await mysql.createConnection(connectionConfig);
  try {
    await conn.beginTransaction();

    const fkName = await getFkToPlat(conn);
    if (!fkName) {
      throw new Error('FK from LIGNE_COMMANDE.id_plat to PLAT not found.');
    }

    const deleteRule = await getFkDeleteRule(conn, fkName);
    if (deleteRule !== 'RESTRICT') {
      console.log(`Updating FK ${fkName} back to ON DELETE RESTRICT ...`);
      await conn.query(`ALTER TABLE LIGNE_COMMANDE DROP FOREIGN KEY \`${fkName}\``);
      await conn.query(
        `
          ALTER TABLE LIGNE_COMMANDE
            ADD CONSTRAINT fk_ligne_plat
            FOREIGN KEY (id_plat) REFERENCES PLAT(id_plat)
            ON DELETE RESTRICT
        `
      );
    } else {
      console.log('FK already ON DELETE RESTRICT.');
    }

    console.log('Making id_plat NOT NULL ...');
    await conn.query('ALTER TABLE LIGNE_COMMANDE MODIFY id_plat INT NOT NULL');

    const hasPlatNom = await getColumnExists(conn, 'LIGNE_COMMANDE', 'plat_nom');
    const hasPlatImageUrl = await getColumnExists(conn, 'LIGNE_COMMANDE', 'plat_image_url');

    if (hasPlatNom) {
      console.log('Dropping column plat_nom ...');
      await conn.query('ALTER TABLE LIGNE_COMMANDE DROP COLUMN plat_nom');
    }

    if (hasPlatImageUrl) {
      console.log('Dropping column plat_image_url ...');
      await conn.query('ALTER TABLE LIGNE_COMMANDE DROP COLUMN plat_image_url');
    }

    await conn.commit();
    console.log('Rollback Option C completed successfully.');
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      // ignore
    }
    console.error('Rollback failed:', err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
};

await run();
