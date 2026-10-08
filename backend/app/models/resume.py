from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    stored_filename: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )

    file_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    file_size: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    processing_status: Mapped[str] = mapped_column(
        String(30),
        default="uploaded",
        nullable=False,
    )

    uploaded_at: Mapped[datetime] = mapped_column(
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

    # ========================================================
    # User Relationship
    # ========================================================

    user = relationship(
        "User",
        back_populates="resumes",
    )

    # ========================================================
    # Parsed Resume Analysis
    # ========================================================

    analysis = relationship(
        "ResumeAnalysis",
        back_populates="resume",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # ========================================================
    # Latest AI Analysis
    # ========================================================

    ai_analysis = relationship(
        "AIAnalysis",
        back_populates="resume",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # ========================================================
    # AI Analysis History
    # ========================================================

    ai_analysis_history = relationship(
        "AIAnalysisHistory",
        back_populates="resume",
        cascade="all, delete-orphan",
        order_by="AIAnalysisHistory.created_at.desc()",
    )

    job_matches = relationship(
        "JobMatch",
        back_populates="resume",
        cascade="all, delete-orphan",
        order_by="JobMatch.created_at.desc()",
    )