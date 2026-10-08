from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AIAnalysisComparisonItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    resume_id: int

    overall_score: int
    ats_score: int
    technical_score: int
    project_score: int
    content_score: int

    created_at: datetime


class AIAnalysisComparisonResponse(BaseModel):
    resume_id: int

    latest: AIAnalysisComparisonItem
    previous: AIAnalysisComparisonItem

    overall_score_change: int
    ats_score_change: int
    technical_score_change: int
    project_score_change: int
    content_score_change: int

    overall_improved: bool
    ats_improved: bool
    technical_improved: bool
    project_improved: bool
    content_improved: bool