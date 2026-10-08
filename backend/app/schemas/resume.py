from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ResumeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_filename: str
    file_type: str
    file_size: int
    processing_status: str
    uploaded_at: datetime
    updated_at: datetime


class ResumeListResponse(BaseModel):
    total: int = Field(
        ge=0,
        description="Total number of resumes matching the filters.",
    )

    page: int = Field(
        ge=1,
        description="Current page number.",
    )

    page_size: int = Field(
        ge=1,
        le=100,
        description="Number of resumes returned per page.",
    )

    total_pages: int = Field(
        ge=0,
        description="Total number of available pages.",
    )

    items: list[ResumeResponse] = Field(
        default_factory=list,
        description="Resumes returned for the current page.",
    )