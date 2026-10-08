from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    resume_id: Mapped[int] = mapped_column(
        ForeignKey("resumes.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    extracted_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    contact_data: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    skills: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )

    experience: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )

    education: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )

    projects: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )

    certifications: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    resume = relationship(
        "Resume",
        back_populates="analysis",
    )