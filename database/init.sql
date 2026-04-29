DROP DATABASE IF EXISTS tsaralaza_restaurant;
CREATE DATABASE tsaralaza_restaurant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tsaralaza_restaurant;

DROP TABLE IF EXISTS LIGNE_COMMANDE;
DROP TABLE IF EXISTS COMMANDE;
DROP TABLE IF EXISTS PLAT;
DROP TABLE IF EXISTS CATEGORIE;
DROP TABLE IF EXISTS TABLE_RESTAURANT;
DROP TABLE IF EXISTS INVITATION;
DROP TABLE IF EXISTS UTILISATEUR;

CREATE TABLE UTILISATEUR (
  id_utilisateur INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE,
  mot_de_passe VARCHAR(255),
  role ENUM('admin','staff','cuisine') NOT NULL,
  statut ENUM('invite','actif','desactive') NOT NULL DEFAULT 'invite',
  actif BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE INVITATION (
  id_invitation INT PRIMARY KEY AUTO_INCREMENT,
  id_utilisateur INT NOT NULL,
  token VARCHAR(255) UNIQUE,
  expire_le DATETIME NOT NULL,
  utilise BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invitation_utilisateur
    FOREIGN KEY (id_utilisateur) REFERENCES UTILISATEUR(id_utilisateur)
    ON DELETE CASCADE
);

CREATE TABLE TABLE_RESTAURANT (
  id_table INT PRIMARY KEY AUTO_INCREMENT,
  numero INT UNIQUE NOT NULL,
  capacite INT,
  statut ENUM('libre','occupee','reservee') DEFAULT 'libre'
);

CREATE TABLE CATEGORIE (
  id_categorie INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(100) NOT NULL,
  ordre INT DEFAULT 0
);

CREATE TABLE PLAT (
  id_plat INT PRIMARY KEY AUTO_INCREMENT,
  id_categorie INT NOT NULL,
  nom VARCHAR(100) NOT NULL,
  description TEXT,
  prix DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(255),
  disponible BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_plat_categorie
    FOREIGN KEY (id_categorie) REFERENCES CATEGORIE(id_categorie)
    ON DELETE RESTRICT
);

CREATE TABLE COMMANDE (
  id_commande INT PRIMARY KEY AUTO_INCREMENT,
  id_table INT NOT NULL,
  id_serveur INT NOT NULL,
  statut ENUM('en_attente','en_preparation','servie','payee') DEFAULT 'en_attente',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_commande_table
    FOREIGN KEY (id_table) REFERENCES TABLE_RESTAURANT(id_table)
    ON DELETE RESTRICT,
  CONSTRAINT fk_commande_serveur
    FOREIGN KEY (id_serveur) REFERENCES UTILISATEUR(id_utilisateur)
    ON DELETE RESTRICT
);

CREATE TABLE LIGNE_COMMANDE (
  id_ligne INT PRIMARY KEY AUTO_INCREMENT,
  id_commande INT NOT NULL,
  id_plat INT NOT NULL,
  quantite INT NOT NULL,
  prix_unitaire DECIMAL(10,2) NOT NULL,
  notes TEXT,
  CONSTRAINT fk_ligne_commande
    FOREIGN KEY (id_commande) REFERENCES COMMANDE(id_commande)
    ON DELETE CASCADE,
  CONSTRAINT fk_ligne_plat
    FOREIGN KEY (id_plat) REFERENCES PLAT(id_plat)
    ON DELETE RESTRICT
);

INSERT INTO UTILISATEUR (nom, email, mot_de_passe, role, statut, actif) VALUES
('Alicio Fernandez', 'admin@tsaralaza.mg', 'Tsaralaza123!', 'admin', 'actif', 1),
('Miora Rabe', 'miora@tsaralaza.mg', 'Tsaralaza123!', 'staff', 'actif', 1),
('Hasina Rakoto', 'hasina@tsaralaza.mg', 'Tsaralaza123!', 'staff', 'actif', 1),
('Rija Andry', 'rija@tsaralaza.mg', NULL, 'staff', 'invite', 1),
('Fetra Cook', 'cuisine@tsaralaza.mg', 'Tsaralaza123!', 'cuisine', 'actif', 1);

INSERT INTO INVITATION (id_utilisateur, token, expire_le, utilise) VALUES
(4, 'invitation-staff-rija-2026', DATE_ADD(NOW(), INTERVAL 7 DAY), 0);

INSERT INTO TABLE_RESTAURANT (numero, capacite, statut) VALUES
(1, 2, 'libre'),
(2, 4, 'occupee'),
(3, 4, 'reservee'),
(4, 6, 'libre'),
(5, 2, 'occupee'),
(6, 8, 'libre');

INSERT INTO CATEGORIE (nom, ordre) VALUES
('Entrees', 1),
('Plats', 2),
('Desserts', 3),
('Boissons', 4);

INSERT INTO PLAT (id_categorie, nom, description, prix, image_url, disponible) VALUES
(1, 'Rouleaux croustillants', 'Feuilles croustillantes et sauce maison.', 12000.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80', 1),
(2, 'Ravitoto royal', 'Porc confit, brèdes manioc et riz blanc.', 22000.00, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80', 1),
(2, 'Poisson coco citron', 'Filet du jour, lait de coco et citron vert.', 26000.00, 'https://images.unsplash.com/photo-1559847844-d721426d6edc?auto=format&fit=crop&w=900&q=80', 1),
(3, 'Moelleux chocolat', 'Coeur fondant et creme vanille.', 9500.00, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80', 1),
(4, 'Jus gingembre passion', 'Boisson fraiche signature.', 7000.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80', 1);

INSERT INTO COMMANDE (id_table, id_serveur, statut, created_at, updated_at) VALUES
(2, 2, 'en_attente', DATE_SUB(NOW(), INTERVAL 40 MINUTE), DATE_SUB(NOW(), INTERVAL 40 MINUTE)),
(5, 3, 'en_preparation', DATE_SUB(NOW(), INTERVAL 25 MINUTE), DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(3, 2, 'servie', DATE_SUB(NOW(), INTERVAL 70 MINUTE), DATE_SUB(NOW(), INTERVAL 15 MINUTE));

INSERT INTO LIGNE_COMMANDE (id_commande, id_plat, quantite, prix_unitaire, notes) VALUES
(1, 2, 2, 22000.00, 'Sans piment'),
(1, 5, 2, 7000.00, NULL),
(2, 1, 1, 12000.00, 'Sauce a part'),
(2, 3, 2, 26000.00, NULL),
(3, 4, 3, 9500.00, NULL),
(3, 5, 3, 7000.00, 'Peu sucre');
