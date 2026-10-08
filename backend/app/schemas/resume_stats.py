from datetime import datetime

from pydantic import BaseModel


class LatestResumeStats(BaseModel):
    id: int
    filename: str
    processing_status: str
    uploaded_at: datetime


class ResumeStatusDistribution(BaseModel):
    uploaded: int = 0
    processing: int = 0
    analyzing: int = 0
    parsed: int = 0
    completed: int = 0
    failed: int = 0


class ResumeStatsResponse(BaseModel):
    total_resumes: int
    analyzed_resumes: int
    pending_resumes: int

    completed_resumes: int
    processing_resumes: int
    failed_resumes: int

    total_ai_analyses: int
    average_overall_score: float

    total_job_matches: int
    average_job_match_score: float

    latest_resume: LatestResumeStats | None = None
    latest_score: float | None = None

    status_distribution: ResumeStatusDistribution