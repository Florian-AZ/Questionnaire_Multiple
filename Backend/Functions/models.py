from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .db_config import Base


class UtilisateurDB(Base):
    __tablename__ = "utilisateurs"
    ID = Column(Integer, primary_key=True, index=True)
    Username = Column(String(100), nullable=False)

    questionnaires_crees = relationship("QuestionnaireDB", back_populates="createur")
    participations = relationship("ParticipationDB", back_populates="utilisateur")


class QuestionnaireDB(Base):
    __tablename__ = "questionaires"
    ID = Column(Integer, primary_key=True, index=True)
    Name = Column(String(120))
    Type = Column(String(50))
    ID_Utilisateur = Column(Integer, ForeignKey("utilisateurs.ID", ondelete="SET NULL"), nullable=True)
    Note_Moyenne = Column(Float, default=0.0)

    createur = relationship("UtilisateurDB", back_populates="questionnaires_crees")
    questions = relationship("QuestionDB", back_populates="questionnaire")
    participations = relationship("ParticipationDB", back_populates="questionnaire")


class QuestionDB(Base):
    __tablename__ = "questions"
    ID = Column(Integer, primary_key=True, index=True)
    Question = Column(String(150))
    ID_Questio = Column(Integer, ForeignKey("questionaires.ID"))

    questionnaire = relationship("QuestionnaireDB", back_populates="questions")
    reponses = relationship("ReponseDB", back_populates="question")


class ReponseDB(Base):
    __tablename__ = "reponse"
    ID = Column(Integer, primary_key=True, index=True)
    Rep = Column(String(150))
    ID_Questions = Column(Integer, ForeignKey("questions.ID"))
    Is_Correct = Column(Enum('Vrai', 'Faux'), default='Faux')

    question = relationship("QuestionDB", back_populates="reponses")


class ParticipationDB(Base):
    __tablename__ = "participations"
    ID = Column(Integer, primary_key=True, index=True)
    ID_Utilisateur = Column(Integer, ForeignKey("utilisateurs.ID", ondelete="CASCADE"), nullable=False)
    ID_Questionnaire = Column(Integer, ForeignKey("questionaires.ID", ondelete="CASCADE"), nullable=False)
    Score = Column(Float, nullable=False)

    utilisateur = relationship("UtilisateurDB", back_populates="participations")
    questionnaire = relationship("QuestionnaireDB", back_populates="participations")