-- Quizzhub : schema MySQL 5.7+/MariaDB, a importer manuellement dans phpMyAdmin.
-- Aucune suppression de table ni de donnee. Pour une base existante, sauvegarder
-- d'abord son contenu et verifier qu'elle utilise les memes colonnes.
CREATE DATABASE IF NOT EXISTS questionaire CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE questionaire;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS utilisateurs (
  ID INT NOT NULL AUTO_INCREMENT,
  Username VARCHAR(100) NOT NULL,
  PRIMARY KEY (ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS questionaires (
  ID INT NOT NULL AUTO_INCREMENT,
  Name VARCHAR(120),
  Type VARCHAR(50),
  ID_Utilisateur INT DEFAULT NULL,
  Note_Moyenne FLOAT DEFAULT 0,
  PRIMARY KEY (ID),
  CONSTRAINT fk_createur FOREIGN KEY (ID_Utilisateur) REFERENCES utilisateurs(ID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS questions (
  ID INT NOT NULL AUTO_INCREMENT,
  Question VARCHAR(150),
  ID_Questio INT,
  PRIMARY KEY (ID),
  CONSTRAINT fk_question_quiz FOREIGN KEY (ID_Questio) REFERENCES questionaires(ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reponse (
  ID INT NOT NULL AUTO_INCREMENT,
  Rep VARCHAR(150),
  ID_Questions INT,
  Is_Correct ENUM('Vrai','Faux') DEFAULT 'Faux',
  PRIMARY KEY (ID),
  CONSTRAINT fk_reponse_question FOREIGN KEY (ID_Questions) REFERENCES questions(ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS participations (
  ID INT NOT NULL AUTO_INCREMENT,
  ID_Utilisateur INT NOT NULL,
  ID_Questionnaire INT NOT NULL,
  Score FLOAT NOT NULL,
  PRIMARY KEY (ID),
  CONSTRAINT fk_participant FOREIGN KEY (ID_Utilisateur) REFERENCES utilisateurs(ID) ON DELETE CASCADE,
  CONSTRAINT fk_participation_quiz FOREIGN KEY (ID_Questionnaire) REFERENCES questionaires(ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
