from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class AIAnalysisHistory(Base):
    __tablename__ = "ai_analysis_history"

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

    overall_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    ats_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    technical_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    project_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    project_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    content_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    strengths: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    weaknesses: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    missing_skills: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    recommendations: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    ai_feedback: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )

    resume = relationship(
        "Resume",
        back_populates="ai_analysis_history",
    )