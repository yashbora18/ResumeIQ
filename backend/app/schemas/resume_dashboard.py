from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# Resume Dashboard - Resume Information
# ============================================================

class DashboardResumeInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    original_filename: str

    file_type: str

    file_size: int

    processing_status: str

    uploaded_at: datetime

    updated_at: datetime


# ============================================================
# Resume Dashboard - Score Information
# ============================================================

class DashboardScores(BaseModel):
    overall: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    ats: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    technical: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    projects: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    content: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )


# ============================================================
# Resume Dashboard - Parsed Sections
# ============================================================

class DashboardSections(BaseModel):
    summary: str = ""

    experience: str = ""

    education: str = ""

    projects: str = ""

    certifications: str = ""


# ============================================================
# Resume Dashboard - Job Match Summary
# ============================================================

class DashboardJobMatchSummary(BaseModel):
    total_matches: int = Field(
        default=0,
        ge=0,
    )

    average_score: float = Field(
        default=0.0,
        ge=0,
        le=100,
    )

    highest_score: int = Field(
        default=0,
        ge=0,
        le=100,
    )

    lowest_score: int = Field(
        default=0,
        ge=0,
        le=100,
    )

    strong_matches: int = Field(
        default=0,
        ge=0,
    )

    moderate_matches: int = Field(
        default=0,
        ge=0,
    )

    weak_matches: int = Field(
        default=0,
        ge=0,
    )


# ============================================================
# Resume Dashboard - Recent Job Match
# ============================================================

class DashboardJobMatch(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    job_title: str

    company_name: str

    match_score: int = Field(
        ge=0,
        le=100,
    )

    created_at: datetime

    # ============================================================
# Resume Dashboard - Readiness Status
# ============================================================

class DashboardStatus(BaseModel):
    resume_uploaded: bool = False
    resume_parsed: bool = False
    ai_analysis_available: bool = False
    job_match_available: bool = False
    ready: bool = False


# ============================================================
# Resume Dashboard - Complete Response
# ============================================================

class ResumeDashboardResponse(BaseModel):
    resume: DashboardResumeInfo

    scores: DashboardScores

    skills: list[str] = Field(
        default_factory=list,
    )

    contact: dict = Field(
        default_factory=dict,
    )

    sections: DashboardSections

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

    dashboard_status: DashboardStatus = Field(
        default_factory=DashboardStatus,
    )

    job_match_summary: DashboardJobMatchSummary = Field(
        default_factory=DashboardJobMatchSummary,
    )

    recent_job_matches: list[DashboardJobMatch] = Field(
        default_factory=list,
    )