from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.models.resume_analysis import ResumeAnalysis

from app.services.resume_parser import parse_resume


def process_resume(
    db: Session,
    resume: Resume,
) -> Resume:
    """
    Process an uploaded resume.

    This function is intentionally limited to resume parsing.

    AI analysis is NOT performed here.

    Upload flow:
        upload file
        -> parse resume
        -> save ResumeAnalysis
        -> mark resume as parsed

    AI analysis is generated separately from the
    /{resume_id}/ai-test endpoint.
    """

    try:
        # ====================================================
        # 1. Mark as processing
        # ====================================================

        resume.processing_status = "processing"

        db.add(resume)
        db.commit()
        db.refresh(resume)

        # ====================================================
        # 2. Parse resume
        # ====================================================

        parsed_data = parse_resume(
            resume.file_path
        )

        # ====================================================
        # 3. Save parsed resume data
        # ====================================================

        resume_analysis = (
            db.query(ResumeAnalysis)
            .filter(
                ResumeAnalysis.resume_id == resume.id
            )
            .first()
        )

        if resume_analysis is None:
            resume_analysis = ResumeAnalysis(
                resume_id=resume.id,
                extracted_text=parsed_data.get(
                    "full_text",
                    "",
                ),
                contact_data=parsed_data.get(
                    "contact",
                    {},
                ),
                skills=parsed_data.get(
                    "skills",
                    [],
                ),
                summary=parsed_data.get(
                    "summary",
                    "",
                ),
                experience=parsed_data.get(
                    "experience",
                    "",
                ),
                education=parsed_data.get(
                    "education",
                    "",
                ),
                projects=parsed_data.get(
                    "projects",
                    "",
                ),
                certifications=parsed_data.get(
                    "certifications",
                    "",
                ),
            )

            db.add(resume_analysis)

        else:
            resume_analysis.extracted_text = (
                parsed_data.get(
                    "full_text",
                    "",
                )
            )

            resume_analysis.contact_data = (
                parsed_data.get(
                    "contact",
                    {},
                )
            )

            resume_analysis.skills = (
                parsed_data.get(
                    "skills",
                    [],
                )
            )

            resume_analysis.summary = (
                parsed_data.get(
                    "summary",
                    "",
                )
            )

            resume_analysis.experience = (
                parsed_data.get(
                    "experience",
                    "",
                )
            )

            resume_analysis.education = (
                parsed_data.get(
                    "education",
                    "",
                )
            )

            resume_analysis.projects = (
                parsed_data.get(
                    "projects",
                    "",
                )
            )

            resume_analysis.certifications = (
                parsed_data.get(
                    "certifications",
                    "",
                )
            )

        # ====================================================
        # 4. Parsing completed
        # ====================================================

        resume.processing_status = "parsed"

        db.add(resume)
        db.commit()

        db.refresh(resume)

        return resume

    except Exception:
        db.rollback()

        # ====================================================
        # Mark processing as failed
        # ====================================================

        try:
            resume.processing_status = "failed"

            db.add(resume)
            db.commit()
            db.refresh(resume)

        except Exception:
            db.rollback()

        raise