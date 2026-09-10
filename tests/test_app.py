import copy
import importlib

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker

from Backend.Functions.db_config import get_db
from Backend.Functions.models import ParticipationDB, QuestionnaireDB

backend = importlib.import_module("Backend.app")


@pytest.fixture
def client(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{(tmp_path / 'test.db').as_posix()}", connect_args={"check_same_thread": False})
    sessions = sessionmaker(bind=engine)
    monkeypatch.setattr(backend, "engine", engine)
    monkeypatch.setattr(backend, "SessionLocal", sessions)
    monkeypatch.setattr(backend, "IS_SQLITE", True)

    def db_override():
        with sessions() as db:
            yield db

    backend.app.dependency_overrides[get_db] = db_override
    with TestClient(backend.app) as test_client:
        test_client.sessions = sessions
        yield test_client
    backend.app.dependency_overrides.clear()
    engine.dispose()


def payload():
    return {"Name": "Quiz de test", "Type": "Sciences", "Username": "Testeur", "questions": [
        {"Question": "Combien font 2 + 2 ?", "reponses": [
            {"Rep": "4", "Is_Correct": "Vrai"}, {"Rep": "5", "Is_Correct": "Faux"}]},
        {"Question": "Combien font 3 + 3 ?", "reponses": [
            {"Rep": "6", "Is_Correct": "Vrai"}, {"Rep": "7", "Is_Correct": "Faux"}]},
    ]}


def create(client):
    response = client.post("/api/quiz/", json=payload())
    assert response.status_code == 201, response.text
    return client.get(f"/api/quiz/{response.json()['ID']}").json()


def submission(quiz, correct=True):
    # Creation preserves IDs in answer order; known fixtures have their correct answer first.
    return {"Username": "Joueur", "answers": [{"question_id": q["ID"], "reponse_id": q["reponses"][0 if correct else 1]["ID"]} for q in quiz["questions"]]}


def test_pages_assets_and_seed(client):
    for path in ["/", "/catalogue", "/creer", "/jouer?id=1", "/static/css/app.css", "/static/script/app.js", "/docs"]:
        assert client.get(path).status_code == 200
    assert "text/html" in client.get("/").headers["content-type"]
    quizzes = client.get("/api/quiz/").json()
    assert len(quizzes) == 3
    assert sum(q["question_count"] for q in quizzes) == 30
    assert all(q["playable"] for q in quizzes)
    assert client.get("/frontend/pages/create-quest.html").url.path == "/creer"


def test_create_play_score_and_average(client):
    quiz = create(client)
    assert quiz["Name"] == payload()["Name"]
    assert quiz["auteur"] == "Testeur"
    assert all("Is_Correct" not in a for q in quiz["questions"] for a in q["reponses"])
    url = f"/api/quiz/{quiz['ID']}/participer/"
    result = client.post(url, json=submission(quiz)).json()
    assert (result["score"], result["correct"], result["total"]) == (100, 2, 2)
    assert result["corrections"][0]["bonne_reponse"] == "4"
    result = client.post(url, json=submission(quiz, False)).json()
    assert result["score"] == 0
    assert result["nouvelle_moyenne_quiz"] == 50
    listed = next(q for q in client.get("/api/quiz/").json() if q["ID"] == quiz["ID"])
    assert listed["participations"] == 2 and listed["Note_Moyenne"] == 50
    with client.sessions() as db:
        assert db.scalar(select(func.count()).select_from(ParticipationDB)) == 2


@pytest.mark.parametrize("change", ["blank", "duplicate", "two_correct", "no_correct", "too_long", "no_questions", "too_many_answers"])
def test_invalid_creation_does_not_persist(client, change):
    body = payload()
    if change == "blank": body["Name"] = "   "
    if change == "duplicate": body["questions"][0]["reponses"][1]["Rep"] = " 4 "
    if change == "two_correct": body["questions"][0]["reponses"][1]["Is_Correct"] = "Vrai"
    if change == "no_correct": body["questions"][0]["reponses"][0]["Is_Correct"] = "Faux"
    if change == "too_long": body["questions"][0]["Question"] = "x" * 151
    if change == "no_questions": body["questions"] = []
    if change == "too_many_answers": body["questions"][0]["reponses"] *= 4
    assert client.post("/api/quiz/", json=body).status_code == 422
    assert len(client.get("/api/quiz/").json()) == 3


@pytest.mark.parametrize("change", ["foreign_answer", "duplicate_question", "missing_question", "fake_score", "unknown_question"])
def test_invalid_submission_does_not_persist(client, change):
    quiz = create(client)
    body = submission(quiz)
    if change == "foreign_answer": body["answers"][0]["reponse_id"] = quiz["questions"][1]["reponses"][0]["ID"]
    if change == "duplicate_question": body["answers"][1] = copy.deepcopy(body["answers"][0])
    if change == "missing_question": body["answers"].pop()
    if change == "fake_score": body["Score"] = 10000
    if change == "unknown_question": body["answers"][0]["question_id"] = 99999
    assert client.post(f"/api/quiz/{quiz['ID']}/participer/", json=body).status_code == 422
    with client.sessions() as db:
        assert db.scalar(select(func.count()).select_from(ParticipationDB)) == 0


def test_unanswered_question_counts_as_incorrect(client):
    quiz = create(client)
    body = submission(quiz)
    body["answers"][1]["reponse_id"] = None
    result = client.post(f"/api/quiz/{quiz['ID']}/participer/", json=body).json()
    assert result["score"] == 50


def test_not_found_and_incomplete_quiz(client):
    assert client.get("/api/quiz/99999").status_code == 404
    with client.sessions() as db:
        quiz = QuestionnaireDB(Name="Import incomplet", Type="Sciences")
        db.add(quiz)
        db.commit()
        quiz_id = quiz.ID
    assert client.get(f"/api/quiz/{quiz_id}").status_code == 409
    assert next(q for q in client.get("/api/quiz/").json() if q["ID"] == quiz_id)["playable"] is False


def test_database_failure_is_actionable_and_frontend_still_loads(client):
    def unavailable():
        raise OperationalError("query", {}, Exception("private database credentials"))
        yield
    backend.app.dependency_overrides[get_db] = unavailable
    response = client.get("/api/quiz/")
    assert response.status_code == 503
    assert "MySQL" in response.json()["detail"]
    assert "private" not in response.text
    assert client.get("/").status_code == 200
