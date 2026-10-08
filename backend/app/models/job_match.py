from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class JobMatch(Base):
    __tablename__ = "job_matches"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    resume_id: Mapped[int] = mapped_column(
        ForeignKey(
            "resumes.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    job_title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    company_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="",
    )

    job_description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    match_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    matching_skills: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    missing_skills: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    matching_keywords: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    missing_keywords: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    recommendations: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )

    resume = relationship(
        "Resume",
        back_populates="job_matches",
    )