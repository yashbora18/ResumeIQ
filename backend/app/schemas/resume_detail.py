from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.ai_analysis import AIAnalysisResponse
from app.schemas.parser import ContactInformation


class ResumeAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    resume_id: int
    extracted_text: str
    contact_data: ContactInformation
    skills: list[str]
    summary: str
    experience: str
    education: str
    projects: str
    certifications: str
    created_at: datetime
    updated_at: datetime


class ResumeDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_filename: str
    file_type: str
    file_size: int
    processing_status: str
    uploaded_at: datetime
    updated_at: datetime
    analysis: ResumeAnalysisResponse | None = None
    ai_analysis: AIAnalysisResponse | None = None