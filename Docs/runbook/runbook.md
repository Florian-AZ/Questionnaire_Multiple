# Runbook — installer, ouvrir et vérifier Quizzhub

Ce guide décrit les opérations à effectuer sur un poste local. La présentation du projet se trouve dans le [README](../../README.md), et les choix d'architecture dans les [ADR](../ADR/000005.md).

## 1. Choisir le bon dossier dans VS Code

Ouvrir **Fichier → Ouvrir le dossier**, puis sélectionner le dossier qui contient :

```text
Questionnaire_Multiple/
├── main.py
├── requirements.txt
├── pyproject.toml
├── Demarrer.bat
├── lancer.py
├── .env.example
├── Backend/
├── frontend/
├── BaseDeDonnée/
├── Docs/
└── tests/
```

Dans la copie locale avec deux dossiers imbriqués, il s'agit du dossier intérieur. Si le terminal se trouve dans le dossier extérieur, exécuter :

```powershell
cd .\Questionnaire_Multiple
```

Vérifier ensuite la présence du point d'entrée :

```powershell
Test-Path .\main.py
```

Le résultat attendu est `True`. Toutes les commandes suivantes partent de ce dossier.

## 2. Préparer Python

### Installation standard sous Windows

Dans **Terminal → Nouveau terminal**, utiliser PowerShell :

```powershell
python --version
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Python doit être en version 3.10 ou supérieure. Si l'environnement est déjà installé et fonctionne, passer directement à l'étape 3.

Il n'est pas nécessaire d'exécuter `Activate.ps1` : les commandes appellent directement le Python de `.venv`. Si l'extension Python de VS Code est installée, sélectionner cet interpréteur avec **Python: Select Interpreter** pour que l'éditeur utilise le même environnement.

### Installation avec uv

Si `uv` est déjà disponible, il peut remplacer les commandes d'installation précédentes :

```powershell
uv venv .venv
uv pip install --python .venv/Scripts/python.exe -r requirements.txt
```

Si `.venv` existe déjà, conserver cet environnement et exécuter seulement la commande d'installation. Un environnement créé avec `uv` peut ne pas contenir `pip` ; utiliser alors `uv pip install`.

### macOS et Linux

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

Dans les étapes suivantes, remplacer `.\.venv\Scripts\python.exe` par `.venv/bin/python`.

## 3. Démarrer et accéder au site

### Depuis VS Code

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8001
```

Attendre les messages `Application startup complete` et `Uvicorn running on http://127.0.0.1:8000`, puis ouvrir [le site](http://127.0.0.1:8000).

Si le port est déjà utilisé, arrêter l'ancien serveur dans son terminal avec **Ctrl+C**, ou choisir un autre port :

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

Dans ce cas, ouvrir [le site sur le port 8001](http://127.0.0.1:8001).

### Depuis l'Explorateur Windows

Double-cliquer sur [Demarrer.bat](../../Demarrer.bat). Le lanceur installe les dépendances manquantes, démarre le serveur sur le port 8000 et tente d'ouvrir le navigateur. Si le navigateur ne s'ouvre pas, accéder manuellement au site après le message de démarrage.

### Pendant l'utilisation

- Garder le terminal ou la fenêtre du lanceur ouvert.
- Utiliser **Ctrl+C** pour arrêter le serveur.
- Actualiser le navigateur après une modification du front.
- `--reload` recharge le back après modification Python ; le lanceur par double-clic n'active pas ce mode.
- Après modification de `.env`, arrêter puis relancer le serveur.

Le site s'utilise sans compte. Un pseudo peut être saisi pour créer un quiz ou participer ; il ne s'agit pas d'un identifiant de connexion. Les identifiants MySQL servent uniquement à la connexion du serveur à sa base.

Live Server, un serveur PHP pour le front ou l'ouverture directe de `frontend/index.html` ne remplacent pas le démarrage FastAPI.

## 4. Vérifier le mode SQLite

Sans variable `DATABASE_URL` configurée, le back utilise `quiz.db` dans le dossier de l'application.

Au démarrage, il crée les tables absentes. Si aucun questionnaire n'existe, il ajoute les trois quiz de démonstration. Les créations et scores sont ensuite conservés dans cette base.

Ouvrir [l'état de connexion](http://127.0.0.1:8000/api/health). Le résultat attendu est :

```json
{"status":"ok","database":"SQLite"}
```

Puis ouvrir [le catalogue](http://127.0.0.1:8000/catalogue) et vérifier la présence des quiz. Utiliser le port 8001 dans ces adresses si c'est celui du serveur.

## 5. Importer et connecter MySQL manuellement

### Préparer le service et importer

1. Démarrer le service MySQL de l'environnement local, par exemple MAMP.
2. Ouvrir son interface phpMyAdmin.
3. Importer [questionaire.sql](../../BaseDeDonnée/questionaire.sql). Le script contient `CREATE DATABASE IF NOT EXISTS questionaire` et `USE questionaire`.
4. Vérifier la présence des cinq tables : `utilisateurs`, `questionaires`, `questions`, `reponse` et `participations`.
5. Pour disposer d'exemples, importer [donnees_demo.sql](../../BaseDeDonnée/donnees_demo.sql) une seule fois. Sinon, créer les quiz depuis le site.

Si une base existe déjà, sauvegarder son contenu et vérifier sa structure avant l'import. Le script ne supprime pas de données, mais `CREATE TABLE IF NOT EXISTS` ne corrige pas des colonnes ou contraintes différentes. Importer le fichier de démonstration plusieurs fois crée plusieurs exemplaires des quiz.

Si un autre nom de base est choisi, adapter les instructions `CREATE DATABASE` et `USE` des scripts concernés, ainsi que l'URL de connexion. Sélectionner une autre base dans phpMyAdmin ne remplace pas le `USE questionaire` contenu dans les scripts.

### Configurer .env

Copier [.env.example](../../.env.example) en `.env` dans le même dossier que `main.py`. S'il existe déjà, modifier ce fichier au lieu de le remplacer.

Exemple de contenu :

```dotenv
DATABASE_URL=mysql+pymysql://root:root@127.0.0.1:3306/questionaire?charset=utf8mb4
```

| Élément | Signification |
| --- | --- |
| `mysql+pymysql` | Moteur MySQL et pilote Python PyMySQL |
| Premier `root` | Utilisateur MySQL |
| Second `root` | Mot de passe MySQL, donné ici à titre d'exemple |
| `127.0.0.1` | Hôte du service MySQL local |
| `3306` | Port MySQL, à adapter ; MAMP peut utiliser 8889 |
| `questionaire` | Nom de la base importée |
| `charset=utf8mb4` | Encodage de la connexion |

Avec un utilisateur `root` sans mot de passe, l'exemple devient :

```dotenv
DATABASE_URL=mysql+pymysql://root@127.0.0.1:3306/questionaire?charset=utf8mb4
```

Les caractères réservés du mot de passe doivent être encodés pour une URL, par exemple `@` devient `%40`. Ne pas ajouter le vrai fichier `.env` à Git : l'exemple partageable est `.env.example`.

### Redémarrer et contrôler

1. Arrêter Uvicorn avec **Ctrl+C**, puis le relancer.
2. Ouvrir [l'état de connexion](http://127.0.0.1:8000/api/health).
3. Vérifier le résultat :

```json
{"status":"ok","database":"MySQL"}
```

4. Charger le catalogue.
5. Créer un quiz, jouer une partie et vérifier dans phpMyAdmin que les enregistrements apparaissent dans les tables correspondantes.

`/api/health` teste une connexion avec `SELECT 1` ; cette route ne valide pas à elle seule les cinq tables. Le chargement du catalogue puis le parcours création/participation complètent la vérification.

Les ports ont des rôles distincts : **8000/8001 pour le site**, **3306/8889 selon la configuration pour MySQL**.

### Revenir au mode SQLite

Retirer ou commenter la ligne `DATABASE_URL` du fichier `.env`, puis redémarrer. Une variable `DATABASE_URL` définie dans l'environnement du processus a priorité sur le fichier ; elle doit aussi être retirée pour retrouver le mode par défaut.

Le fichier `quiz.db` existant sera réutilisé. Aucune donnée MySQL n'est transférée vers SQLite, ni inversement. Un changement de base n'est pas une migration.

## 6. Vérifier les fonctionnalités

| Scénario | Manipulation | Résultat attendu |
| --- | --- | --- |
| Catalogue | Rechercher `cinema` avec les exemples présents | Le quiz Cinéma est trouvé malgré l'absence d'accent |
| Filtres | Choisir un univers, puis revenir à tous les quiz | Cartes et compteur cohérents |
| Aucun résultat | Saisir un terme absent des quiz | Message explicite et lien de réinitialisation |
| Brouillon | Commencer un quiz puis actualiser la page | Le contenu saisi est restauré dans ce navigateur |
| Validation | Laisser un champ vide ou dupliquer deux réponses | Publication refusée avec un retour de validation |
| Publication | Créer un quiz complet | Confirmation et accès à sa page de jeu |
| Partie | Répondre, avancer puis revenir en arrière | Choix précédent conservé |
| Résultat | Terminer la partie | Pourcentage, correction et participation enregistrée |
| Persistance | Redémarrer Uvicorn après publication | Quiz publié toujours présent |
| Petit écran | Réduire la largeur du navigateur | Navigation et formulaires utilisables sans débordement horizontal |

Le brouillon et le pseudo sont stockés par origine du site. Un autre navigateur, un autre port ou l'utilisation de `localhost` au lieu de `127.0.0.1` ne retrouve pas nécessairement ce stockage. Les quiz publiés appartiennent à la base et ne dépendent pas du stockage navigateur.

Le contenu d'une partie en cours n'est pas sauvegardé après rechargement. Les résultats ne sont enregistrés qu'à la soumission finale.

## 7. Exécuter les tests automatisés

Dans le dossier contenant `main.py`, installer les dépendances de test :

```powershell
.\.venv\Scripts\python.exe -m pip install "pytest>=8,<10" "httpx>=0.27,<1"
```

Avec un environnement géré par `uv`, utiliser à la place :

```powershell
uv pip install --python .venv/Scripts/python.exe "pytest>=8,<10" "httpx>=0.27,<1"
```

Lancer ensuite :

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Le fichier [test_app.py](../../tests/test_app.py) vérifie les pages, les quiz de démonstration, la création, les scores, les moyennes, les entrées invalides et les erreurs de base. Les tests utilisent des bases SQLite temporaires ; ils ne modifient pas `quiz.db` ni la base MySQL configurée.

Avec Node.js disponible, contrôler également la syntaxe du JavaScript :

```powershell
node --check frontend/script/app.js
```

Ce contrôle ne lance pas le site et ne remplace pas les vérifications visuelles.

**État de la mise en place du 10 septembre 2026 :** 17 tests automatisés réussis, parcours navigateur et rendu sur ordinateur/petits écrans vérifiés. Les modèles ont été compilés pour le dialecte MySQL ; une connexion et un import sur la base MySQL de l'utilisateur restent à tester après configuration.

## 8. Dépannage

| Symptôme | Vérifications et action |
| --- | --- |
| `python` introuvable | Vérifier l'installation de Python et sa disponibilité dans le terminal |
| `.venv\Scripts\python.exe` introuvable | Vérifier le dossier courant, puis créer l'environnement |
| `No module named pip` | Pour un environnement créé avec uv, utiliser les commandes `uv pip install` ci-dessus |
| `Could not import module main` | Lancer depuis le dossier contenant `main.py`, avec le Python de `.venv` |
| `No module named fastapi` ou `sqlalchemy` | Installer `requirements.txt` dans l'environnement utilisé pour lancer le serveur |
| Port déjà utilisé / erreur 10048 | Arrêter le serveur existant ou utiliser `--port 8001`, puis ouvrir cette nouvelle adresse |
| Le navigateur ne peut pas accéder au site | Vérifier que Uvicorn tourne, que le démarrage est terminé et que le port de l'URL correspond |
| Erreur de base de données / HTTP 503 | Vérifier le service MySQL, l'hôte, le port, les identifiants, le nom de base et les tables importées |
| `/api/health` fonctionne mais le catalogue échoue | Vérifier la structure des cinq tables : le test de connexion ne vérifie pas le schéma |
| L'import mentionne une table ou une contrainte inconnue | Vérifier l'import du schéma complet et la structure d'une éventuelle ancienne base |
| SQLite reste actif après configuration MySQL | Vérifier que le fichier s'appelle exactement `.env`, se trouve près de `main.py`, puis redémarrer |
| Le mauvais moteur reste actif | Vérifier la présence d'une variable `DATABASE_URL` dans l'environnement, prioritaire sur `.env` |
| Catalogue vide après passage à MySQL | Importer les données facultatives ou créer un quiz ; les données SQLite ne sont pas copiées |
| Un quiz importé n'est pas jouable | Vérifier ses questions, ses propositions et l'unique bonne réponse de chaque question |
| Brouillon absent | Vérifier navigateur, adresse, port et éventuel effacement du stockage local |
| Une modification CSS/JS n'apparaît pas | Actualiser la page ; si besoin utiliser `Ctrl+F5` |
| Le site ne s'ouvre pas sur un autre appareil | Le lancement fourni écoute uniquement sur l'ordinateur local |

## 9. Données à conserver

- Pour SQLite, arrêter le serveur avant de copier `quiz.db` pour une sauvegarde.
- Pour MySQL, exporter la base avec l'outil d'administration utilisé.
- Conserver `.env` localement pour retrouver les paramètres, sans l'ajouter au dépôt.
- Le brouillon est dans le navigateur ; publier le quiz est nécessaire pour l'enregistrer dans la base.

Les limites et le périmètre fonctionnel de cette version sont décrits dans le [README](../../README.md).
