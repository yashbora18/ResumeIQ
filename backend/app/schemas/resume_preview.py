from datetime import datetime

from pydantic import BaseModel, Field


class ResumePreviewResponse(BaseModel):
    id: int = Field(
        description="Resume ID.",
    )

    original_filename: str = Field(
        description="Original uploaded filename.",
    )

    file_type: str = Field(
        description="Resume file type.",
    )

    file_size: int = Field(
        ge=0,
        description="Resume file size in bytes.",
    )

    processing_status: str = Field(
        description="Current resume processing status.",
    )

    uploaded_at: datetime = Field(
        description="Resume upload timestamp.",
    )

    updated_at: datetime = Field(
        description="Resume last updated timestamp.",
    )

    file_exists: bool = Field(
        description="Whether the stored resume file currently exists.",
    )

    download_url: str = Field(
        description="API endpoint used to download the resume.",
    )