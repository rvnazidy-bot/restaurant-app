-- Migration Option C (snapshot)
-- Objectif: permettre la suppression des plats sans casser l'historique des commandes.
-- Prérequis: MySQL / MariaDB. Exécuter sur la base ${DB_NAME}.

-- 1) Ajouter les colonnes snapshot si elles n'existent pas
ALTER TABLE LIGNE_COMMANDE
  ADD COLUMN plat_nom VARCHAR(100) NULL,
  ADD COLUMN plat_image_url VARCHAR(255) NULL;

-- 2) Backfill des snapshots depuis la table PLAT
UPDATE LIGNE_COMMANDE l
JOIN PLAT p ON p.id_plat = l.id_plat
SET
  l.plat_nom = COALESCE(l.plat_nom, p.nom),
  l.plat_image_url = COALESCE(l.plat_image_url, p.image_url);

-- 3) Rendre plat_nom obligatoire
ALTER TABLE LIGNE_COMMANDE
  MODIFY plat_nom VARCHAR(100) NOT NULL;

-- 4) Rendre id_plat nullable
ALTER TABLE LIGNE_COMMANDE
  MODIFY id_plat INT NULL;

-- 5) Remplacer la FK vers PLAT pour autoriser la suppression du plat
-- NOTE: si ta FK n'a pas ce nom, adapte-le après avoir lancé:
--   SHOW CREATE TABLE LIGNE_COMMANDE;
ALTER TABLE LIGNE_COMMANDE
  DROP FOREIGN KEY fk_ligne_plat;

ALTER TABLE LIGNE_COMMANDE
  ADD CONSTRAINT fk_ligne_plat
  FOREIGN KEY (id_plat) REFERENCES PLAT(id_plat)
  ON DELETE SET NULL;
