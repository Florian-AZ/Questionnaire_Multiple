# Questionnaire_Multiple

## Présentation

Ce projet a été réalisé dans le cadre d’un travail de groupe afin de mettre en pratique l’utilisation de **Git et GitHub** dans un projet collaboratif.

L’objectif est de créer une application de **questionnaire à choix multiple**.

La complexité technique du projet n’est pas l’objectif principal. Nous cherchons surtout à mettre en place une bonne organisation du travail avec les outils GitHub.

## Objectifs du projet

Le projet doit permettre de :

* créer des questionnaires ;
* ajouter des questions et des réponses ;
* récupérer les questionnaires disponibles ;
* répondre à un questionnaire ;
* vérifier les réponses envoyées.

## Technologies utilisées

Nous utilisons principalement :

* **Python**
* **FastAPI** pour le backend
* **MySQL** pour la base de données
* **Git et GitHub** pour le travail collaboratif
* **phpMyAdmin** pour gérer la base de données en local

FastAPI a été choisi car nous venons de l’apprendre et ce projet nous permet de nous entraîner à l’utiliser.

## Organisation Git

Nous avons choisi d’utiliser **GitHub Flow**.

Pour chaque nouvelle fonctionnalité :

1. une issue est créée ;
2. une branche est créée à partir de la branche de travail ;
3. les modifications sont réalisées sur cette branche ;
4. les changements sont commités et pushés ;
5. une Pull Request est créée ;
6. un autre membre du groupe effectue une code review ;
7. la Pull Request est ensuite fusionnée.

Exemple de nom de branche :

```text id="5db8j8"
feature/config-fastapi
```

## Installation du projet

Cloner le repository :

```bash id="76fkbx"
git clone https://github.com/Florian-AZ/Questionnaire_Multiple.git
cd Questionnaire_Multiple
```

Créer un environnement virtuel Python :

```bash id="uevvyf"
python3 -m venv .venv
```

L’activer sur macOS/Linux :

```bash id="v06gje"
source .venv/bin/activate
```

Installer les dépendances :

```bash id="9q3y3w"
pip install -r requirements.txt
```

## Lancer le serveur

Pour lancer l’API FastAPI :

```bash id="elxxyf"
fastapi dev main.py
```

Le serveur est ensuite disponible à l’adresse :

```text id="t95o74"
http://127.0.0.1:8000
```

La documentation automatique de l’API est disponible sur :

```text id="142fea"
http://127.0.0.1:8000/docs
```

## Base de données

Le projet utilise une base de données **MySQL**.

La base peut être lancée localement avec un outil comme :

* MAMP
* XAMPP
* WAMP

Les informations détaillées pour installer et lancer la base de données sont disponibles dans le **Runbook** du projet.

## Documentation

La documentation du projet est organisée dans le dossier `docs`.

On y retrouve notamment :

* l’**ADR**, qui explique nos choix techniques ;
* le **Runbook**, qui explique comment installer et lancer le projet.

## Organisation du travail

Les tâches sont créées sous forme d’**Issues GitHub** et réparties entre les membres du groupe.

Chaque membre travaille sur ses propres branches et crée des Pull Requests afin que le code puisse être relu par un autre membre avant d’être fusionné.

Cela permet de garder une trace des différentes étapes du projet et de répartir le travail de manière équilibrée.

## Auteurs

Projet réalisé en groupe dans le cadre d’un exercice sur **Git, GitHub et le travail collaboratif**.
