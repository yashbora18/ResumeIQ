from datetime import datetime

from pydantic import BaseModel, Field


class AIAnalysisResult(BaseModel):
    overall_score: int = Field(
        ge=0,
        le=100,
        description=(
            "Overall score placeholder. "
            "The backend calculates the final overall score."
        ),
    )

    ats_score: int = Field(
        ge=0,
        le=100,
        description="ATS compatibility score from 0 to 100.",
    )

    technical_score: int = Field(
        ge=0,
        le=100,
        description="Technical skills strength score from 0 to 100.",
    )

    project_score: int = Field(
        ge=0,
        le=100,
        description="Project quality score from 0 to 100.",
    )

    content_score: int = Field(
        ge=0,
        le=100,
        description=(
            "Resume content quality score from 0 to 100, "
            "covering clarity, completeness, structure, "
            "and quality of resume content."
        ),
    )

    strengths: list[str] = Field(
        default_factory=list,
        description="Important strengths identified in the resume.",
    )

    weaknesses: list[str] = Field(
        default_factory=list,
        description="Important weaknesses identified in the resume.",
    )

    missing_skills: list[str] = Field(
        default_factory=list,
        description="Relevant technical skills that appear to be missing.",
    )

    recommendations: list[str] = Field(
        default_factory=list,
        description="Actionable recommendations for improving the resume.",
    )

    ai_feedback: str = Field(
        default="",
        description="Detailed overall feedback about the resume.",
    )


class AIAnalysisResponse(AIAnalysisResult):
    id: int
    resume_id: int
    created_at: datetime
    updated_at: datetime