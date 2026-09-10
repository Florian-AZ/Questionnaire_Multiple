from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from Functions.db_config import get_db
from Functions.models import QuestionnaireDB, QuestionDB, ReponseDB, UtilisateurDB, ParticipationDB
from Api.schemas import QuestionnaireCreate, QuestionCreate, ReponseCreate, UtilisateurCreate, ParticipationCreate

router = APIRouter()


# --- ROUTES UTILISATEURS ---
@router.post("/utilisateurs/")
def create_utilisateur(user: UtilisateurCreate, db: Session = Depends(get_db)):
    db_user = UtilisateurDB(Username=user.Username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/utilisateurs/")
def get_utilisateurs(db: Session = Depends(get_db)):
    return db.query(UtilisateurDB).all()


# --- ROUTES QUESTIONNAIRES ---
@router.post("/quiz/")
def create_quiz(quiz: QuestionnaireCreate, db: Session = Depends(get_db)):
    db_quiz = QuestionnaireDB(
        Name=quiz.Name,
        Type=quiz.Type,
        ID_Utilisateur=quiz.ID_Utilisateur
    )
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz


@router.get("/quiz/")
def get_quizzes(db: Session = Depends(get_db)):
    return db.query(QuestionnaireDB).all()


@router.post("/quiz/{quiz_id}/questions/")
def add_question(quiz_id: int, question: QuestionCreate, db: Session = Depends(get_db)):
    db_quiz = db.query(QuestionnaireDB).filter(QuestionnaireDB.ID == quiz_id).first()
    if not db_quiz:
        raise HTTPException(status_code=404, detail="Questionnaire non trouvé")

    db_question = QuestionDB(Question=question.Question, ID_Questio=quiz_id)
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question


@router.post("/questions/{question_id}/reponses/")
def add_reponse(question_id: int, reponse: ReponseCreate, db: Session = Depends(get_db)):
    db_question = db.query(QuestionDB).filter(QuestionDB.ID == question_id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question non trouvée")

    if reponse.Is_Correct not in ['Vrai', 'Faux']:
        raise HTTPException(status_code=400, detail="Is_Correct doit être 'Vrai' ou 'Faux'")

    db_reponse = ReponseDB(Rep=reponse.Rep, ID_Questions=question_id, Is_Correct=reponse.Is_Correct)
    db.add(db_reponse)
    db.commit()
    db.refresh(db_reponse)
    return db_reponse


# --- ROUTE PARTICIPATIONS ET NOTES ---
@router.post("/quiz/{quiz_id}/participer/")
def submit_score(quiz_id: int, participation: ParticipationCreate, db: Session = Depends(get_db)):
    # 1. Vérifier si le questionnaire et l'utilisateur existent
    db_quiz = db.query(QuestionnaireDB).filter(QuestionnaireDB.ID == quiz_id).first()
    if not db_quiz:
        raise HTTPException(status_code=404, detail="Questionnaire non trouvé")

    db_user = db.query(UtilisateurDB).filter(UtilisateurDB.ID == participation.ID_Utilisateur).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    # 2. Enregistrer la participation
    db_participation = ParticipationDB(
        ID_Utilisateur=participation.ID_Utilisateur,
        ID_Questionnaire=quiz_id,
        Score=participation.Score
    )
    db.add(db_participation)
    db.commit()

    # 3. Recalculer la note moyenne du questionnaire
    avg_score = db.query(func.avg(ParticipationDB.Score)).filter(ParticipationDB.ID_Questionnaire == quiz_id).scalar()
    db_quiz.Note_Moyenne = round(avg_score, 2)
    db.commit()

    return {"message": "Score enregistré", "nouvelle_moyenne_quiz": db_quiz.Note_Moyenne}