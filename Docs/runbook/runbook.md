RUNBOOK — Questionnaire Multiple
Ce document explique comment installer et lancer le projet en local.
1. Récupérer le projet
Cloner le dépôt GitHub puis se placer dans le dossier du projet :
git clone https://github.com/Florian-AZ/Questionnaire_Multiple.git
cd Questionnaire_Multiple
2. Préparer l’environnement Python
Créer un environnement virtuel :
python3 -m venv .venv
L’activer sur macOS/Linux :
source .venv/bin/activate
Sur Windows :
.venv\Scripts\activate
Installer ensuite les dépendances :
pip install -r requirements.txt
3. Lancer la base de données
Utiliser un environnement local comme MAMP, XAMPP ou WAMP.
Vérifier que le service MySQL est bien démarré.
Créer la base
Ouvrir phpMyAdmin, puis :
* créer une nouvelle base de données, par exemple quiz_db ;
* sélectionner cette base ;
* importer le script SQL du projet lorsqu’il sera disponible ;
* exécuter le script afin de créer les tables.
4. Configurer la connexion à MySQL
Configurer l’URL de connexion à la base selon le port utilisé.
Exemple avec MySQL sur le port 3306 :
DATABASE_URL = "mysql+pymysql://root@localhost:3306/quiz_db"
Exemple avec MAMP sur le port 8889 :
DATABASE_URL = "mysql+pymysql://root:root@localhost:8889/quiz_db"
Remplacer quiz_db par le nom réel de la base de données.
5. Lancer l’API FastAPI
Depuis la racine du projet, lancer :
fastapi dev main.py
Il est également possible d’utiliser Uvicorn :
python -m uvicorn main:app --reload
Le serveur est ensuite accessible à l’adresse :
http://127.0.0.1:8000
La documentation Swagger de l’API est disponible ici :
http://127.0.0.1:8000/docs
6. Arrêter le serveur
Dans le terminal :
Ctrl + C
Problèmes courants
Le serveur FastAPI ne démarre pas
Vérifier que l’environnement virtuel est activé et réinstaller les dépendances :
source .venv/bin/activate
pip install -r requirements.txt
Impossible de se connecter à MySQL
Vérifier :
* que MySQL est démarré ;
* que le port est correct ;
* que le nom de la base est correct ;
* que l’identifiant et le mot de passe MySQL sont corrects.
