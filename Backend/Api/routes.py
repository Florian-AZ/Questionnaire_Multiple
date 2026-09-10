from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session, selectinload
from ..Functions.db_config import IS_SQLITE, get_db
from ..Functions.models import QuestionnaireDB, QuestionDB, ReponseDB, UtilisateurDB, ParticipationDB
from .schemas import QuestionnaireCreate, ParticipationCreate

router = APIRouter(prefix="/api")

def quiz_query():
    return select(QuestionnaireDB).options(
        selectinload(QuestionnaireDB.questions).selectinload(QuestionDB.reponses),
        selectinload(QuestionnaireDB.createur))

def playable(quiz):
    return bool(quiz.questions) and all(
        2 <= len(q.reponses) <= 6 and sum(a.Is_Correct == "Vrai" for a in q.reponses) == 1
        for q in quiz.questions)

def summary(quiz, plays=0):
    return {"ID": quiz.ID, "Name": quiz.Name, "Type": quiz.Type,
            "auteur": quiz.createur.Username if quiz.createur else "Anonyme",
            "question_count": len(quiz.questions), "participations": plays,
            "Note_Moyenne": quiz.Note_Moyenne or 0, "playable": playable(quiz)}

@router.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "SQLite" if IS_SQLITE else "MySQL"}

@router.get("/quiz/")
def get_quizzes(db: Session = Depends(get_db)):
    counts = dict(db.execute(select(ParticipationDB.ID_Questionnaire, func.count())
                            .group_by(ParticipationDB.ID_Questionnaire)).all())
    return [summary(q, counts.get(q.ID, 0)) for q in db.scalars(quiz_query().order_by(QuestionnaireDB.ID.desc()))]

@router.post("/quiz/", status_code=201)
def create_quiz(payload: QuestionnaireCreate, db: Session = Depends(get_db)):
    # One transaction: no half-created quiz if a question is invalid.
    user = UtilisateurDB(Username=payload.Username)
    quiz = QuestionnaireDB(Name=payload.Name, Type=payload.Type, createur=user)
    for question in payload.questions:
        quiz.questions.append(QuestionDB(Question=question.Question, reponses=[
            ReponseDB(Rep=a.Rep, Is_Correct=a.Is_Correct) for a in question.reponses]))
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return summary(quiz)

@router.get("/quiz/{quiz_id}")
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.scalar(quiz_query().where(QuestionnaireDB.ID == quiz_id))
    if not quiz:
        raise HTTPException(404, "Questionnaire introuvable.")
    if not playable(quiz):
        raise HTTPException(409, "Ce questionnaire ne contient pas encore de questions jouables.")
    return {**summary(quiz), "questions": [
        {"ID": q.ID, "Question": q.Question,
         "reponses": [{"ID": a.ID, "Rep": a.Rep} for a in sorted(q.reponses, key=lambda a: a.ID)]}
        for q in sorted(quiz.questions, key=lambda q: q.ID)]}

@router.post("/quiz/{quiz_id}/participer/")
def submit_answers(quiz_id: int, payload: ParticipationCreate, db: Session = Depends(get_db)):
    # Serialize submissions on MySQL so the cached average stays consistent.
    quiz = db.scalar(quiz_query().where(QuestionnaireDB.ID == quiz_id).with_for_update())
    if not quiz:
        raise HTTPException(404, "Questionnaire introuvable.")
    if not playable(quiz):
        raise HTTPException(409, "Questionnaire incomplet.")
    answers = {a.question_id: a.reponse_id for a in payload.answers}
    if len(answers) != len(payload.answers) or set(answers) != {q.ID for q in quiz.questions}:
        raise HTTPException(422, "Envoie une réponse par question du questionnaire.")
    corrections = []
    for q in sorted(quiz.questions, key=lambda q: q.ID):
        chosen = answers[q.ID]
        if chosen is not None and chosen not in {a.ID for a in q.reponses}:
            raise HTTPException(422, "Une réponse n'appartient pas à sa question.")
        good = next(a for a in q.reponses if a.Is_Correct == "Vrai")
        selected = next((a for a in q.reponses if a.ID == chosen), None)
        corrections.append({"question": q.Question, "correct": chosen == good.ID,
                            "bonne_reponse": good.Rep, "reponse": selected.Rep if selected else None})
    correct = sum(c["correct"] for c in corrections)
    score = round(100 * correct / len(corrections), 2)
    user = UtilisateurDB(Username=payload.Username)
    db.add(ParticipationDB(utilisateur=user, questionnaire=quiz, Score=score))
    db.flush()
    quiz.Note_Moyenne = round(db.scalar(select(func.avg(ParticipationDB.Score))
                                      .where(ParticipationDB.ID_Questionnaire == quiz_id)), 2)
    db.commit()
    return {"score": score, "correct": correct, "total": len(corrections),
            "corrections": corrections, "nouvelle_moyenne_quiz": quiz.Note_Moyenne}
