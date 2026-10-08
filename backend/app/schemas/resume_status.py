from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ResumeStatusResponse(BaseModel):
    resume_id: int = Field(
        description="Resume ID.",
    )

    filename: str = Field(
        default="",
        description="Original uploaded resume filename.",
    )

    processing_status: str = Field(
        default="uploaded",
        description="Current resume processing status.",
    )

    progress: int = Field(
        default=0,
        ge=0,
        le=100,
        description="Estimated processing progress percentage.",
    )

    status_message: str = Field(
        default="Resume uploaded and waiting for processing.",
        description="Human-readable processing status message.",
    )

    is_completed: bool = Field(
        default=False,
        description="Whether resume processing is completed.",
    )

    is_processing: bool = Field(
        default=False,
        description="Whether resume processing is currently in progress.",
    )

    is_failed: bool = Field(
        default=False,
        description="Whether resume processing failed.",
    )

    has_parsed_data: bool = Field(
        default=False,
        description="Whether parsed resume data exists.",
    )

    has_ai_analysis: bool = Field(
        default=False,
        description="Whether AI analysis exists.",
    )

    uploaded_at: Optional[datetime] = Field(
        default=None,
        description="Resume upload timestamp.",
    )

    updated_at: Optional[datetime] = Field(
        default=None,
        description="Last status update timestamp.",
    )