# Quizzhub — Questionnaire Multiple

Quizzhub permet de découvrir, créer et jouer à des questionnaires à choix multiples. L'application associe une API **FastAPI**, une base gérée avec **SQLAlchemy** et une interface **HTML, CSS et JavaScript**.

Le front et le back sont servis par le même serveur. L'installation ne nécessite ni compilation du front ni Live Server.

## 1. Prérequis et dossier de travail

- **Python 3.10 ou supérieur**, accessible avec la commande `python`.
- Un navigateur récent.
- Une connexion Internet pour installer les dépendances la première fois.
- **MySQL/MAMP** uniquement pour utiliser une base MySQL.
- **Node.js** uniquement pour le contrôle facultatif de syntaxe JavaScript.

Toutes les commandes ci-dessous sont à lancer dans **le dossier contenant `main.py`, `requirements.txt` et `Demarrer.bat`**. Si le dossier ouvert contient un second dossier `Questionnaire_Multiple`, entrer dans ce sous-dossier.

## 2. Démarrage rapide sous Windows

Double-cliquer sur [Demarrer.bat](Demarrer.bat). Le lanceur vérifie l'environnement Python, installe les dépendances si nécessaire, puis démarre le serveur et ouvre le navigateur.

Accéder au site : **[http://127.0.0.1:8000](http://127.0.0.1:8000)**.

Garder la fenêtre du serveur ouverte. **Ctrl+C** permet de l'arrêter. Le lanceur utilise le port 8000 ; pour un autre port, utiliser la commande VS Code ci-dessous.

Sans `DATABASE_URL` configurée, le premier démarrage crée `quiz.db` dans ce dossier et ajoute trois quiz de dix questions chacun. Les données restent présentes après redémarrage.

## 3. Lancer et tester dans VS Code

### Première installation

Ouvrir ce dossier dans VS Code, puis **Terminal → Nouveau terminal**. Dans PowerShell :

```powershell
python --version
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

L'activation de l'environnement n'est pas obligatoire : les commandes utilisent directement son interpréteur.

Si l'environnement a été préparé avec `uv` et ne contient pas `pip`, installer les dépendances avec :

```powershell
uv pip install --python .venv/Scripts/python.exe -r requirements.txt
```

### Lancer l'application

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Ouvrir [Quizzhub](http://127.0.0.1:8000) après l'affichage de `Application startup complete`.

Si un serveur utilise déjà le port 8000 :

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

Ouvrir alors [Quizzhub sur le port 8001](http://127.0.0.1:8001). Utiliser ce même port pour le site, l'API et sa documentation.

`--reload` relance le serveur après une modification Python. Après un changement HTML, CSS ou JavaScript, actualiser le navigateur. Arrêter puis relancer le serveur après une modification de `.env`.

### macOS et Linux

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

## 4. Accéder au site et l'utiliser

**Aucune inscription ni connexion par mot de passe n'est implémentée.** Le pseudo saisi lors de la création ou du jeu identifie l'auteur ou la participation. Un pseudo vide dans l'interface devient `Anonyme`.

| Page | Adresse avec le port 8000 | Fonction |
| --- | --- | --- |
| Accueil | [Ouvrir](http://127.0.0.1:8000/) | Présentation, compteurs réels et aperçu des quiz |
| Catalogue | [Explorer](http://127.0.0.1:8000/catalogue) | Recherche sans accents, filtres et tri |
| Création | [Créer](http://127.0.0.1:8000/creer) | Rédiger et publier un questionnaire |
| Partie | Accessible depuis une carte du catalogue | Jouer à un quiz à l'adresse `/jouer?id=…` |
| Documentation API | [Swagger](http://127.0.0.1:8000/docs) | Consulter et essayer les routes |
| Connexion à la base | [État de connexion](http://127.0.0.1:8000/api/health) | Vérifier le moteur utilisé et sa disponibilité |

Pour tester le parcours complet :

1. Jouer à un quiz depuis le catalogue.
2. Choisir une réponse par question ; le bouton **Précédente** permet de modifier les choix avant l'envoi.
3. Consulter le score et les bonnes réponses à la fin.
4. Créer un quiz, puis le retrouver dans le catalogue.
5. Arrêter et redémarrer le serveur : le quiz et les participations enregistrées restent disponibles.

Un quiz contient **1 à 50 questions**, chacune avec **2 à 6 réponses différentes et une seule bonne réponse**. Le score est calculé par le serveur en pourcentage, puis enregistré avec la participation. La moyenne du quiz est mise à jour.

Le brouillon de création et le dernier pseudo sont conservés dans le navigateur. Une partie en cours reste en mémoire dans la page : la recharger fait perdre les choix non envoyés.

L'adresse `127.0.0.1` désigne l'ordinateur qui exécute le serveur. La configuration fournie donne un accès local ; le site n'est pas déployé sur Internet.

## 5. Utiliser sa base MySQL

SQLite sert au démarrage immédiat. Pour utiliser MySQL, **l'import et la configuration sont manuels** :

1. Démarrer MySQL avec l'environnement local utilisé.
2. Ouvrir phpMyAdmin et importer [BaseDeDonnée/questionaire.sql](BaseDeDonnée/questionaire.sql). Le script sélectionne la base `questionaire` et crée ses cinq tables.
3. Facultativement, importer [BaseDeDonnée/donnees_demo.sql](BaseDeDonnée/donnees_demo.sql) **une seule fois** pour ajouter les trois quiz. Un nouvel import ajoute de nouveaux exemplaires.
4. Copier [.env.example](.env.example) en `.env` dans le dossier contenant `main.py`.
5. Adapter la variable à la configuration réelle :

```dotenv
DATABASE_URL=mysql+pymysql://root:root@127.0.0.1:3306/questionaire?charset=utf8mb4
```

Les identifiants ci-dessus sont un exemple. Adapter le nom d'utilisateur, le mot de passe, le port et le nom de base. Le port MySQL peut être `3306` ou, selon MAMP, `8889` ; il est distinct du port HTTP `8000` du site. Les caractères réservés du mot de passe doivent être encodés dans l'URL, par exemple `@` devient `%40`.

6. Arrêter puis relancer le serveur.
7. Vérifier [la connexion à la base](http://127.0.0.1:8000/api/health), qui doit renvoyer `{"status":"ok","database":"MySQL"}`, puis charger le catalogue pour vérifier les tables.

La procédure détaillée et les erreurs courantes figurent dans le [runbook](Docs/runbook/runbook.md).

Les données SQLite et MySQL sont indépendantes : changer la connexion ne les transfère pas. Une configuration MySQL invalide ne déclenche pas de retour automatique à SQLite. Le script SQL crée les tables absentes ; il ne migre pas une structure existante.

## 6. Architecture et échanges

```text
Navigateur
    │ HTTP : pages, fichiers statiques et JSON
    ▼
Uvicorn → main:app → Backend/app.py
    ├── /, /catalogue, /creer, /jouer → frontend/index.html
    ├── /static → CSS, JavaScript et assets
    └── /api → validation Pydantic → SQLAlchemy → SQLite ou MySQL
```

| Fichier ou dossier | Rôle |
| --- | --- |
| [main.py](main.py) | Point d'entrée unique de l'application |
| [lancer.py](lancer.py) et [Demarrer.bat](Demarrer.bat) | Démarrage Windows et ouverture du navigateur |
| [Backend/app.py](Backend/app.py) | Application, initialisation SQLite, pages et gestion des erreurs SQL |
| [Backend/Api/routes.py](Backend/Api/routes.py) | Routes du catalogue, création et participation |
| [Backend/Api/schemas.py](Backend/Api/schemas.py) | Validation des données reçues |
| [Backend/Functions/db_config.py](Backend/Functions/db_config.py) | Lecture de `.env`, moteur et sessions SQLAlchemy |
| [Backend/Functions/models.py](Backend/Functions/models.py) | Modèles des cinq tables |
| [Backend/seed.json](Backend/seed.json) | Trois quiz de démonstration |
| [frontend/index.html](frontend/index.html) | Structure commune de l'interface |
| [frontend/css/app.css](frontend/css/app.css) | Design et adaptation aux tailles d'écran |
| [frontend/script/app.js](frontend/script/app.js) | Vues, formulaires, brouillons et appels API |
| [tests/test_app.py](tests/test_app.py) | Tests d'intégration du back |

Le navigateur appelle `/api` sur la même adresse que le site. La publication envoie le questionnaire complet en une seule requête et l'enregistre dans une transaction. Pendant une partie, l'API ne fournit pas le champ `Is_Correct` ; les corrections sont renvoyées après l'envoi des réponses.

| Méthode | Route | Utilisation |
| --- | --- | --- |
| GET | `/api/health` | Tester la connexion à la base |
| GET | `/api/quiz/` | Lister les questionnaires et leurs statistiques |
| POST | `/api/quiz/` | Créer un questionnaire complet |
| GET | `/api/quiz/{quiz_id}` | Charger les questions et réponses proposées |
| POST | `/api/quiz/{quiz_id}/participer/` | Envoyer les choix et obtenir la correction |

Les noms historiques des tables et colonnes sont conservés. Les anciennes pages HTML redirigent vers les nouvelles vues. Les anciennes routes sans préfixe `/api` et la création question par question sont remplacées par le contrat ci-dessus.

## 7. Vérifications et limites actuelles

Voir le [runbook de test](Docs/runbook/runbook.md) pour les commandes et les scénarios manuels.

Lors de la mise en place du 10 septembre 2026, **17 tests automatisés ont réussi** sur des bases SQLite temporaires. Le parcours création → partie → résultat, la restauration du brouillon et le rendu sur ordinateur et petits écrans ont aussi été vérifiés dans le navigateur. Ces résultats ne remplacent pas un test sur la base MySQL importée : cette connexion reste à valider après configuration.

L'application ne propose pas encore d'authentification, d'espace administrateur, de modification ou de suppression des quiz publiés depuis l'interface. Elle fournit un fonctionnement local ; aucun hébergement public n'est configuré.

## 8. Décisions d'architecture

- [ADR 000001 — FastAPI, validation et calcul des scores](Docs/ADR/000001.md)
- [ADR 000002 — SQLite local et MySQL configurable](Docs/ADR/000002.md)
- [ADR 000003 — Frontend HTML/CSS/JavaScript](Docs/ADR/000003.md)
- [ADR 000004 — Git, revue et vérifications](Docs/ADR/000004.md)
- [ADR 000005 — Serveur unique et accès local](Docs/ADR/000005.md)
