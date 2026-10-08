from pydantic import BaseModel


class ContactInformation(BaseModel):
    email: str | None = None
    phone: str | None = None


class ParsedResumeResponse(BaseModel):
    resume_id: int
    filename: str
    contact: ContactInformation
    skills: list[str]
    sections: dict[str, str]
    full_text: str