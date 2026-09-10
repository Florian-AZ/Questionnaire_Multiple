import sys
import os

# Ajoute le dossier actuel (Backend) aux chemins de recherche de Python
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from Functions.db_config import engine, Base
from Api.routes import router

# Création des tables si elles n'existent pas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Quiz Multiple avec Utilisateurs")

# On inclut les routes définies dans le dossier Api
app.include_router(router)