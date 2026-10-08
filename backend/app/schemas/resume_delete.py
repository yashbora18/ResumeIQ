from pydantic import BaseModel


class ResumeDeleteResponse(BaseModel):
    message: str
    resume_id: int
    filename: str