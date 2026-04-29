import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  return new Promise((resolve, reject) => {
    try {
      const dbPath = path.join(__dirname, '..', 'tsaralaza_restaurant.db');

      // Supprimer la base existante si elle existe
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }

      const db = new sqlite3.Database(dbPath);

      console.log('Connexion à la base de données SQLite établie.');

      // Lire le fichier SQL d'initialisation
      const sqlFile = path.join(__dirname, '..', 'database', 'init-sqlite.sql');
      const sql = fs.readFileSync(sqlFile, 'utf8');

      // Exécuter les commandes SQL
      db.exec(sql, (err) => {
        if (err) {
          console.error('Erreur lors de l\'exécution du SQL :', err);
          reject(err);
          return;
        }

        console.log('Base de données initialisée avec succès !');
        db.close((err) => {
          if (err) {
            console.error('Erreur lors de la fermeture :', err);
            reject(err);
            return;
          }
          console.log('Connexion fermée.');
          resolve();
        });
      });

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la base de données :', error);
      reject(error);
    }
  });
}

initDatabase().catch(() => process.exit(1));