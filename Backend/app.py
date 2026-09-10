import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from .Functions.db_config import Base, ROOT, IS_SQLITE, SessionLocal, engine
from .Functions.models import QuestionnaireDB, QuestionDB, ReponseDB, UtilisateurDB
from .Api.routes import router

@asynccontextmanager
async def lifespan(app):
    # MySQL schema/import remains a manual action. Only bootstrap local SQLite.
    if IS_SQLITE:
        Base.metadata.create_all(engine)
        with SessionLocal() as db:
            if not db.scalar(select(QuestionnaireDB.ID).limit(1)):
                author = UtilisateurDB(Username="La sélection Quizzhub")
                for item in json.loads((ROOT / "Backend/seed.json").read_text(encoding="utf-8")):
                    quiz = QuestionnaireDB(Name=item["Name"], Type=item["Type"], createur=author)
                    for q in item["questions"]:
                        quiz.questions.append(QuestionDB(Question=q["Question"], reponses=[ReponseDB(**r) for r in q["reponses"]]))
                    db.add(quiz)
                db.commit()
    yield

app = FastAPI(title="Quizzhub", version="1.0.0", lifespan=lifespan)
app.include_router(router)

@app.exception_handler(SQLAlchemyError)
async def database_error(request: Request, exc: SQLAlchemyError):
    logging.getLogger(__name__).warning("Database request failed (%s)", type(exc).__name__)
    return JSONResponse(status_code=503, content={"detail":
        "La base de données est indisponible ou incomplète. Vérifie le service MySQL, le fichier .env et l'import de BaseDeDonnée/questionaire.sql, puis réessaie."})

@app.get("/", include_in_schema=False)
@app.get("/catalogue", include_in_schema=False)
@app.get("/creer", include_in_schema=False)
@app.get("/jouer", include_in_schema=False)
def frontend():
    return FileResponse(ROOT / "frontend/index.html")

@app.get("/frontend/pages/{page}", include_in_schema=False)
def legacy_page(page: str):
    destination = {"index.html": "/", "catalogue.html": "/catalogue", "create-quest.html": "/creer"}
    return RedirectResponse(destination.get(page, "/catalogue"))

app.mount("/static", StaticFiles(directory=ROOT / "frontend"), name="static")
