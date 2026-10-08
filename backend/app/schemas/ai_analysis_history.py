from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AIAnalysisHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    resume_id: int

    overall_score: int = Field(
        ge=0,
        le=100,
    )

    ats_score: int = Field(
        ge=0,
        le=100,
    )

    technical_score: int = Field(
        ge=0,
        le=100,
    )

    project_score: int = Field(
        ge=0,
        le=100,
    )

    content_score: int = Field(
        ge=0,
        le=100,
    )

    strengths: list[str] = Field(
        default_factory=list,
    )

    weaknesses: list[str] = Field(
        default_factory=list,
    )

    missing_skills: list[str] = Field(
        default_factory=list,
    )

    recommendations: list[str] = Field(
        default_factory=list,
    )

    ai_feedback: str = ""

    created_at: datetime