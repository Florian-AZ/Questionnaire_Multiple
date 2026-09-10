from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

Text150 = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]

class InputModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

class ReponseCreate(InputModel):
    Rep: Text150
    Is_Correct: Literal["Vrai", "Faux"]

class QuestionCreate(InputModel):
    Question: Text150
    reponses: list[ReponseCreate] = Field(min_length=2, max_length=6)

    @model_validator(mode="after")
    def validate_answers(self):
        if sum(a.Is_Correct == "Vrai" for a in self.reponses) != 1:
            raise ValueError("Chaque question doit avoir exactement une bonne réponse.")
        if len({a.Rep.casefold() for a in self.reponses}) != len(self.reponses):
            raise ValueError("Les réponses d'une question doivent être différentes.")
        return self

class QuestionnaireCreate(InputModel):
    Name: str = Field(min_length=1, max_length=120)
    Type: str = Field(min_length=1, max_length=50)
    Username: str = Field(default="Anonyme", min_length=1, max_length=100)
    questions: list[QuestionCreate] = Field(min_length=1, max_length=50)

class AnswerSubmission(InputModel):
    question_id: int = Field(gt=0)
    reponse_id: int | None = Field(default=None, gt=0)

class ParticipationCreate(InputModel):
    Username: str = Field(default="Anonyme", min_length=1, max_length=100)
    answers: list[AnswerSubmission] = Field(min_length=1, max_length=50)
