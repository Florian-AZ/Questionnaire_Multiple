-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:3306
-- Généré le : jeu. 10 sep. 2026 à 13:13
-- Version du serveur : 5.7.24
-- Version de PHP : 8.3.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `questionaire`
--

-- --------------------------------------------------------

--
-- Structure de la table `questionaires`
--

CREATE TABLE `questionaires` (
  `ID` int(11) NOT NULL,
  `Name` varchar(120) DEFAULT NULL,
  `Type` varchar(50) DEFAULT NULL,
  `ID_Utilisateur` int(11) DEFAULT NULL,
  `Note_Moyenne` float DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Déchargement des données de la table `questionaires`
--

INSERT INTO `questionaires` (`ID`, `Name`, `Type`, `ID_Utilisateur`, `Note_Moyenne`) VALUES
(1, 'Le Système Solaire', 'Science', 1, 0),
(2, 'Histoire de France', 'Histoire', 1, 0),
(3, 'Culture Cinématographique', 'Divertissement', 1, 0);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `questionaires`
--
ALTER TABLE `questionaires`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `fk_createur` (`ID_Utilisateur`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `questionaires`
--
ALTER TABLE `questionaires`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `questionaires`
--
ALTER TABLE `questionaires`
  ADD CONSTRAINT `fk_createur` FOREIGN KEY (`ID_Utilisateur`) REFERENCES `utilisateurs` (`ID`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
