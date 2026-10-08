from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class JobMatchCreate(BaseModel):
    job_title: str = Field(
        min_length=1,
        max_length=255,
        description="Target job title.",
    )

    company_name: str = Field(
        default="",
        max_length=255,
        description="Company name.",
    )

    job_description: str = Field(
        min_length=50,
        description="Complete job description.",
    )


class JobMatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    resume_id: int

    job_title: str
    company_name: str
    job_description: str

    match_score: int = Field(
        ge=0,
        le=100,
    )

    matching_skills: list[str] = Field(
        default_factory=list,
    )

    missing_skills: list[str] = Field(
        default_factory=list,
    )

    matching_keywords: list[str] = Field(
        default_factory=list,
    )

    missing_keywords: list[str] = Field(
        default_factory=list,
    )

    recommendations: list[str] = Field(
        default_factory=list,
    )

    created_at: datetime


class JobMatchListResponse(BaseModel):
    total: int
    items: list[JobMatchResponse]

class JobMatchStatisticsResponse(BaseModel):
    total_matches: int
    average_score: float
    highest_score: int
    lowest_score: int
    strong_matches: int
    moderate_matches: int
    weak_matches: int