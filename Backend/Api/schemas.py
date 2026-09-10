from pydantic import BaseModel
from typing import Optional

class UtilisateurCreate(BaseModel):
    Username: str

class QuestionnaireCreate(BaseModel):
    Name: str
    Type: str
    ID_Utilisateur: Optional[int] = None

class QuestionCreate(BaseModel):
    Question: str

class ReponseCreate(BaseModel):
    Rep: str
    Is_Correct: str

class ParticipationCreate(BaseModel):
    ID_Utilisateur: int
    Score: float