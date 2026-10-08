from pathlib import Path







from uuid import uuid4







from io import BytesIO







from zipfile import BadZipFile, ZipFile















from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from fastapi.responses import FileResponse







from sqlalchemy.orm import Session



from sqlalchemy import func















from app.core.dependencies import get_current_user







from app.database.connection import get_db















from app.models.resume import Resume







from app.models.resume_analysis import ResumeAnalysis







from app.models.ai_analysis import AIAnalysis







from app.models.ai_analysis_history import AIAnalysisHistory







from app.models.user import User







from app.models.job_match import JobMatch

from app.services.notification_service import create_notification















from app.schemas.resume import ResumeResponse







from app.schemas.resume_detail import ResumeDetailResponse







from app.schemas.parser import ParsedResumeResponse







from app.schemas.ai_analysis import AIAnalysisResponse







from app.schemas.resume_dashboard import ResumeDashboardResponse







from app.schemas.resume_status import ResumeStatusResponse







from app.schemas.resume_delete import ResumeDeleteResponse







from app.schemas.resume_stats import ResumeStatsResponse







from app.schemas.ai_analysis_history import AIAnalysisHistoryResponse







from app.schemas.ai_analysis_comparison import AIAnalysisComparisonResponse







from app.schemas.job_match import (



    JobMatchCreate,



    JobMatchResponse,



    JobMatchListResponse,



    JobMatchStatisticsResponse,



)











from app.services.resume_parser import parse_resume

from app.services.resume_processor import process_resume






from app.services.ai_analyzer import analyze_resume_text







from app.services.job_match_analyzer import analyze_job_match























# ============================================================







# Router







# ============================================================















router = APIRouter(







    prefix="/api/v1/resumes",







    tags=["Resumes"],







)























# ============================================================







# Configuration







# ============================================================















UPLOAD_DIR = Path("uploads")







UPLOAD_DIR.mkdir(parents=True, exist_ok=True)















ALLOWED_EXTENSIONS = {







    ".pdf": "pdf",







    ".docx": "docx",







}















MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB























# ============================================================







# 1. Upload Resume







# ============================================================















@router.post(







    "/upload",







    response_model=ResumeResponse,







    status_code=status.HTTP_201_CREATED,







)







async def upload_resume(







    file: UploadFile = File(...),







    current_user: User = Depends(get_current_user),







    db: Session = Depends(get_db),







):







    """







    Upload a PDF or DOCX resume.















    The file is stored on disk and its metadata is saved







    in the resumes table.







    """















    if not file.filename:







        raise HTTPException(







            status_code=status.HTTP_400_BAD_REQUEST,







            detail="A file is required.",







        )















    # Keep only the basename so a client cannot influence the storage path.







    original_filename = Path(file.filename).name.strip()







    if not original_filename:







        raise HTTPException(







            status_code=status.HTTP_400_BAD_REQUEST,







            detail="The uploaded filename is invalid.",







        )















    if len(original_filename) > 255:







        raise HTTPException(







            status_code=status.HTTP_400_BAD_REQUEST,







            detail="Filename must not exceed 255 characters.",







        )















    extension = Path(original_filename).suffix.lower()















    if extension not in ALLOWED_EXTENSIONS:







        raise HTTPException(







            status_code=status.HTTP_400_BAD_REQUEST,







            detail="Only PDF and DOCX files are allowed.",







        )















    file_content = await file.read(MAX_FILE_SIZE + 1)















    if not file_content:







        raise HTTPException(







            status_code=status.HTTP_400_BAD_REQUEST,







            detail="Uploaded file is empty.",







        )















    if len(file_content) > MAX_FILE_SIZE:







        raise HTTPException(







            status_code=status.HTTP_400_BAD_REQUEST,







            detail="File size must not exceed 5 MB.",







        )















    # Validate the actual file content instead of trusting the extension.







    if extension == ".pdf":







        if not file_content.startswith(b"%PDF-"):







            raise HTTPException(







                status_code=status.HTTP_400_BAD_REQUEST,







                detail="The uploaded PDF file is invalid or corrupted.",







            )















    elif extension == ".docx":







        try:







            with ZipFile(BytesIO(file_content)) as archive:







                names = set(archive.namelist())







                if "[Content_Types].xml" not in names or "word/document.xml" not in names:







                    raise HTTPException(







                        status_code=status.HTTP_400_BAD_REQUEST,







                        detail="The uploaded DOCX file is invalid or corrupted.",







                    )







        except BadZipFile as exc:







            raise HTTPException(







                status_code=status.HTTP_400_BAD_REQUEST,







                detail="The uploaded DOCX file is invalid or corrupted.",







            ) from exc















    stored_filename = f"{uuid4().hex}{extension}"







    file_path = UPLOAD_DIR / stored_filename















    try:







        file_path.write_bytes(file_content)















        resume = Resume(







            user_id=current_user.id,







            original_filename=original_filename,







            stored_filename=stored_filename,







            file_type=ALLOWED_EXTENSIONS[extension],







            file_size=len(file_content),







            file_path=str(file_path),







            processing_status="uploaded",







        )















        db.add(resume)

        create_notification(
            db,
            user_id=current_user.id,
            notification_type="resume_uploaded",
            title="Resume uploaded",
            message=f"{resume.original_filename} was uploaded successfully.",
        )







        db.commit()
        db.refresh(resume)

        # ========================================================
        # Automatically process the uploaded resume
        # ========================================================

        try:
            resume = process_resume(
                db=db,
                resume=resume,
            )

        except Exception:
            # process_resume marks the resume as failed.
            # Keep the resume record so the user can see its status.
            db.rollback()

            resume = (
                db.query(Resume)
                .filter(
                    Resume.id == resume.id,
                    Resume.user_id == current_user.id,
                )
                .first()
            )

            if resume is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Resume processing failed.",
                )

        return resume















    except Exception as exc:







        db.rollback()















        if file_path.exists():







            file_path.unlink()















        raise HTTPException(







            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,







            detail="Failed to upload the resume.",







        ) from exc























# ============================================================







# 2. Get Current User's Resumes







# ============================================================















@router.get(







    "",







    response_model=list[ResumeResponse],







)







def get_my_resumes(







    current_user: User = Depends(get_current_user),







    db: Session = Depends(get_db),







):







    """







    Return all resumes belonging to the authenticated user.







    """















    resumes = (







        db.query(Resume)







        .filter(







            Resume.user_id == current_user.id,







        )







        .order_by(







            Resume.uploaded_at.desc(),







        )







        .all()







    )















    return resumes



# ============================================================
# 3.5 Download Resume
# ============================================================

@router.get(
    "/{resume_id}/download",
)
def download_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download a resume file owned by the authenticated user."""

    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if resume is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )

    stored_path = Path(resume.file_path)

    if not stored_path.is_absolute():
        stored_path = Path.cwd() / stored_path

    try:
        resolved_path = stored_path.resolve()
        upload_root = UPLOAD_DIR.resolve()

        resolved_path.relative_to(upload_root)

    except (OSError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found.",
        )

    if not resolved_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found.",
        )

    filename = Path(
        resume.original_filename or resolved_path.name
    ).name

    media_types = {
        ".pdf": "application/pdf",
        ".docx": (
            "application/"
            "vnd.openxmlformats-officedocument."
            "wordprocessingml.document"
        ),
    }

    return FileResponse(
        path=str(resolved_path),
        media_type=media_types.get(
            resolved_path.suffix.lower(),
            "application/octet-stream",
        ),
        filename=filename,
    )



















# ============================================================







# 3. Resume Dashboard







# ============================================================















@router.get(







    "/{resume_id}/dashboard",







    response_model=ResumeDashboardResponse,







)







def get_resume_dashboard(







    resume_id: int,







    current_user: User = Depends(get_current_user),







    db: Session = Depends(get_db),







):







    """







    Return all information required by the ResumeIQ







    resume analysis dashboard.















    This endpoint retrieves existing data from PostgreSQL.







    It does not call Gemini.







    """















    resume = (







        db.query(Resume)







        .filter(







            Resume.id == resume_id,







            Resume.user_id == current_user.id,







        )







        .first()







    )















    if resume is None:







        raise HTTPException(







            status_code=status.HTTP_404_NOT_FOUND,







            detail="Resume not found.",







        )















    resume_analysis = (







        db.query(ResumeAnalysis)







        .filter(







            ResumeAnalysis.resume_id == resume.id,







        )







        .first()







    )















    ai_analysis = (







        db.query(AIAnalysis)







        .filter(







            AIAnalysis.resume_id == resume.id,







        )







        .first()







    )















    if ai_analysis is not None:







        scores = {







            "overall": ai_analysis.overall_score,







            "ats": ai_analysis.ats_score,







            "technical": ai_analysis.technical_score,







            "projects": ai_analysis.project_score,







        }















        strengths = ai_analysis.strengths or []







        weaknesses = ai_analysis.weaknesses or []







        missing_skills = ai_analysis.missing_skills or []







        recommendations = ai_analysis.recommendations or []







        ai_feedback = ai_analysis.ai_feedback or ""















    else:







        scores = {







            "overall": None,







            "ats": None,







            "technical": None,







            "projects": None,







        }















        strengths = []







        weaknesses = []







        missing_skills = []







        recommendations = []







        ai_feedback = ""















    if resume_analysis is not None:







        skills = resume_analysis.skills or []







        contact = resume_analysis.contact_data or {}















        sections = {







            "summary": resume_analysis.summary or "",







            "experience": resume_analysis.experience or "",







            "education": resume_analysis.education or "",







            "projects": resume_analysis.projects or "",







            "certifications": resume_analysis.certifications or "",







        }















    else:







        skills = []







        contact = {}















        sections = {







            "summary": "",







            "experience": "",







            "education": "",







            "projects": "",







            "certifications": "",







        }















    job_matches = (

        db.query(JobMatch)

        .filter(JobMatch.resume_id == resume.id)

        .order_by(JobMatch.created_at.desc())

        .all()

    )



    if job_matches:

        match_scores = [job_match.match_score for job_match in job_matches]

        total_matches = len(match_scores)

        average_score = round(sum(match_scores) / total_matches, 2)

        highest_score = max(match_scores)

        lowest_score = min(match_scores)

        strong_matches = sum(1 for score in match_scores if score >= 75)

        moderate_matches = sum(1 for score in match_scores if 60 <= score < 75)

        weak_matches = sum(1 for score in match_scores if score < 60)

    else:

        total_matches = 0

        average_score = 0.0

        highest_score = 0

        lowest_score = 0

        strong_matches = 0

        moderate_matches = 0

        weak_matches = 0



    job_match_summary = {

        "total_matches": total_matches,

        "average_score": average_score,

        "highest_score": highest_score,

        "lowest_score": lowest_score,

        "strong_matches": strong_matches,

        "moderate_matches": moderate_matches,

        "weak_matches": weak_matches,

    }



    recent_job_matches = [

        {

            "id": job_match.id,

            "job_title": job_match.job_title,

            "company_name": job_match.company_name,

            "match_score": job_match.match_score,

            "created_at": job_match.created_at,

        }

        for job_match in job_matches[:5]

    ]



    return {







        "resume": {







            "id": resume.id,







            "original_filename": resume.original_filename,







            "file_type": resume.file_type,







            "file_size": resume.file_size,







            "processing_status": resume.processing_status,







            "uploaded_at": resume.uploaded_at,







            "updated_at": resume.updated_at,







        },







        "scores": scores,







        "skills": skills,







        "contact": contact,







        "sections": sections,







        "strengths": strengths,







        "weaknesses": weaknesses,







        "missing_skills": missing_skills,







        "recommendations": recommendations,







        "ai_feedback": ai_feedback,







    }



















# ============================================================







# 4. Resume Processing Status







# ============================================================















@router.get(







    "/{resume_id}/status",







    response_model=ResumeStatusResponse,







)







def get_resume_status(







    resume_id: int,







    current_user: User = Depends(get_current_user),







    db: Session = Depends(get_db),







):







    """







    Return the current processing status of a resume.







    """















    resume = (







        db.query(Resume)







        .filter(







            Resume.id == resume_id,







            Resume.user_id == current_user.id,







        )







        .first()







    )















    if resume is None:







        raise HTTPException(







            status_code=status.HTTP_404_NOT_FOUND,







            detail="Resume not found.",







        )















    resume_analysis = (







        db.query(ResumeAnalysis)







        .filter(







            ResumeAnalysis.resume_id == resume.id,







        )







        .first()







    )















    ai_analysis = (







        db.query(AIAnalysis)







        .filter(







            AIAnalysis.resume_id == resume.id,







        )







        .first()







    )















    has_parsed_data = resume_analysis is not None







    has_ai_analysis = ai_analysis is not None















    processing_status = resume.processing_status















    if has_ai_analysis:







        processing_status = "completed"















    elif has_parsed_data:







        processing_status = "parsed"















    elif processing_status == "uploaded":







        processing_status = "uploaded"















    return {







        "resume_id": resume.id,







        "filename": resume.original_filename,







        "processing_status": processing_status,







        "has_parsed_data": has_parsed_data,







        "has_ai_analysis": has_ai_analysis,







    }























# ============================================================







# 5. Delete Resume







# ============================================================















@router.delete(







    "/{resume_id}",







    response_model=ResumeDeleteResponse,







    status_code=status.HTTP_200_OK,







)







def delete_resume(







    resume_id: int,







    current_user: User = Depends(get_current_user),







    db: Session = Depends(get_db),







):







    """







    Delete a resume belonging to the authenticated user.















    This removes:







    - Resume database record







    - Parsed ResumeAnalysis







    - AIAnalysis







    - AIAnalysisHistory







    - Uploaded resume file







    """















    resume = (







        db.query(Resume)







        .filter(







            Resume.id == resume_id,







            Resume.user_id == current_user.id,







        )







        .first()







    )















    if resume is None:







        raise HTTPException(







            status_code=status.HTTP_404_NOT_FOUND,







            detail="Resume not found.",







        )















    filename = resume.original_filename







    stored_file_path = Path(resume.file_path)















    try:







        if stored_file_path.exists():







            stored_file_path.unlink()















        db.delete(resume)







        db.commit()















        return {







            "message": "Resume deleted successfully.",







            "resume_id": resume_id,







            "filename": filename,







        }















    except Exception as exc:







        db.rollback()















        raise HTTPException(







            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,







            detail="Failed to delete the resume.",







        ) from exc























# ============================================================







# 6. Resume Statistics







# ============================================================















@router.get(







    "/stats",







)





def get_resume_stats(







    current_user: User = Depends(get_current_user),







    db: Session = Depends(get_db),







):







    """Return complete resume, AI-analysis, and job-match statistics."""







    resumes = (

        db.query(Resume)

        .filter(Resume.user_id == current_user.id)

        .order_by(Resume.uploaded_at.desc())

        .all()

    )



    total_resumes = len(resumes)

    resume_ids = [resume.id for resume in resumes]



    status_distribution = {

        "uploaded": 0,

        "processing": 0,

        "analyzing": 0,

        "parsed": 0,

        "completed": 0,

        "failed": 0,

    }



    analyzed_resume_rows = (

        db.query(Resume.id)

        .join(AIAnalysis, AIAnalysis.resume_id == Resume.id)

        .filter(Resume.user_id == current_user.id)

        .distinct()

        .all()

    )

    analyzed_resume_ids = {row[0] for row in analyzed_resume_rows}

    analyzed_count = len(analyzed_resume_ids)



    # A resume with a successfully saved AI analysis has completed the

    # application's processing workflow, even if its raw processing_status

    # remains "parsed". This keeps analytics aligned with the actual user

    # workflow instead of exposing a stale intermediate status.

    for resume in resumes:

        status_name = (resume.processing_status or "uploaded").lower()



        if resume.id in analyzed_resume_ids:

            status_distribution["completed"] += 1

            continue



        if status_name in status_distribution:

            status_distribution[status_name] += 1

        else:

            status_distribution["uploaded"] += 1



    total_ai_analyses = 0

    average_overall_score = 0.0

    latest_score = None



    if resume_ids:

        ai_statistics = (

            db.query(

                func.count(AIAnalysis.id).label("total_analyses"),

                func.avg(AIAnalysis.overall_score).label("average_score"),

            )

            .join(Resume, Resume.id == AIAnalysis.resume_id)

            .filter(Resume.user_id == current_user.id)

            .first()

        )



        total_ai_analyses = int(ai_statistics.total_analyses or 0)

        average_overall_score = round(

            float(ai_statistics.average_score or 0),

            2,

        )



        latest_ai_analysis = (

            db.query(AIAnalysis)

            .join(Resume, Resume.id == AIAnalysis.resume_id)

            .filter(Resume.user_id == current_user.id)

            .order_by(AIAnalysis.id.desc())

            .first()

        )



        if latest_ai_analysis is not None:

            latest_score = float(latest_ai_analysis.overall_score)

            if latest_score.is_integer():

                latest_score = int(latest_score)



    job_statistics = (

        db.query(

            func.count(JobMatch.id).label("total_matches"),

            func.avg(JobMatch.match_score).label("average_score"),

        )

        .join(Resume, Resume.id == JobMatch.resume_id)

        .filter(Resume.user_id == current_user.id)

        .first()

    )



    total_job_matches = int(job_statistics.total_matches or 0)

    average_job_match_score = round(

        float(job_statistics.average_score or 0),

        2,

    )



    latest_resume = resumes[0] if resumes else None

    latest_resume_data = None



    if latest_resume is not None:

        latest_resume_data = {

            "id": latest_resume.id,

            "filename": latest_resume.original_filename,

            "processing_status": latest_resume.processing_status,

            "uploaded_at": latest_resume.uploaded_at,

        }



    return {

        "total_resumes": total_resumes,

        "analyzed_resumes": analyzed_count,

        "pending_resumes": max(total_resumes - analyzed_count, 0),

        "completed_resumes": status_distribution["completed"],

        "processing_resumes": status_distribution["processing"],

        "failed_resumes": status_distribution["failed"],

        "total_ai_analyses": total_ai_analyses,

        "average_overall_score": average_overall_score,

        "total_job_matches": total_job_matches,

        "average_job_match_score": average_job_match_score,

        "latest_resume": latest_resume_data,

        "latest_score": latest_score,

        "status_distribution": status_distribution,

    }







# ============================================================



# 7. Download Resume



# ============================================================





@router.get(





    "/{resume_id}/download",





)



def download_resume(





    resume_id: int,





    current_user: User = Depends(get_current_user),





    db: Session = Depends(get_db),





):





    """Download a resume owned by the authenticated user."""





    resume = (

        db.query(Resume)

        .filter(

            Resume.id == resume_id,

            Resume.user_id == current_user.id,

        )

        .first()

    )





    if resume is None:

        raise HTTPException(

            status_code=status.HTTP_404_NOT_FOUND,

            detail="Resume not found.",

        )





    stored_path = Path(resume.file_path)



    if not stored_path.is_absolute():

        stored_path = Path.cwd() / stored_path



    try:

        resolved_path = stored_path.resolve()

        upload_root = (Path.cwd() / "uploads").resolve()

        resolved_path.relative_to(upload_root)

    except (OSError, ValueError):

        raise HTTPException(

            status_code=status.HTTP_404_NOT_FOUND,

            detail="Resume file not found.",

        )





    if not resolved_path.is_file():

        raise HTTPException(

            status_code=status.HTTP_404_NOT_FOUND,

            detail="Resume file not found.",

        )





    filename = Path(resume.original_filename or resolved_path.name).name

    extension = resolved_path.suffix.lower()



    media_types = {

        ".pdf": "application/pdf",

        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    }





    return FileResponse(

        path=str(resolved_path),

        media_type=media_types.get(extension, "application/octet-stream"),

        filename=filename,

    )







# ============================================================



# 8. Get Single Resume With Analysis



# ============================================================



@router.get(







    "/{resume_id}",







    response_model=ResumeDetailResponse,







)







def get_resume(







    resume_id: int,







    current_user: User = Depends(get_current_user),







    db: Session = Depends(get_db),







):







    """







    Return one resume together with its parsed resume analysis







    and saved AI analysis.







    """















    resume = (







        db.query(Resume)







        .filter(







            Resume.id == resume_id,







            Resume.user_id == current_user.id,







        )







        .first()







    )















    if resume is None:







        raise HTTPException(







            status_code=status.HTTP_404_NOT_FOUND,







            detail="Resume not found.",







        )















    return resume























# ============================================================







# 8. Parse Resume







# ============================================================















@router.post(







    "/{resume_id}/parse",







    response_model=ParsedResumeResponse,







)







def parse_uploaded_resume(







    resume_id: int,







    current_user: User = Depends(get_current_user),







    db: Session = Depends(get_db),







):







    """







    Parse an uploaded resume and persist the extracted information.







    """















    resume = (







        db.query(Resume)







        .filter(







            Resume.id == resume_id,







            Resume.user_id == current_user.id,







        )







        .first()







    )















    if resume is None:







        raise HTTPException(







            status_code=status.HTTP_404_NOT_FOUND,







            detail="Resume not found.",







        )















    file_path = Path(resume.file_path)















    if not file_path.exists():







        raise HTTPException(







            status_code=status.HTTP_404_NOT_FOUND,







            detail="Resume file is missing from storage.",







        )















    try:







        parsed_data = parse_resume(file_path)















    except FileNotFoundError as exc:







        raise HTTPException(







            status_code=status.HTTP_404_NOT_FOUND,







            detail=str(exc),







        ) from exc















    except ValueError as exc:







        raise HTTPException(







            status_code=status.HTTP_400_BAD_REQUEST,







            detail=str(exc),







        ) from exc















    except Exception as exc:







        raise HTTPException(







            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,







            detail="Failed to parse the resume.",







        ) from exc















    sections = parsed_data["sections"]















    analysis = (







        db.query(ResumeAnalysis)







        .filter(







            ResumeAnalysis.resume_id == resume.id,







        )







        .first()







    )















    if analysis:







        analysis.extracted_text = parsed_data["full_text"]







        analysis.contact_data = parsed_data["contact"]







        analysis.skills = parsed_data["skills"]







        analysis.summary = sections.get("summary", "")







        analysis.experience = sections.get("experience", "")







        analysis.education = sections.get("education", "")







        analysis.projects = sections.get("projects", "")







        analysis.certifications = sections.get("certifications", "")















    else:







        analysis = ResumeAnalysis(







            resume_id=resume.id,







            extracted_text=parsed_data["full_text"],







            contact_data=parsed_data["contact"],







            skills=parsed_data["skills"],







            summary=sections.get("summary", ""),







            experience=sections.get("experience", ""),







            education=sections.get("education", ""),







            projects=sections.get("projects", ""),







            certifications=sections.get("certifications", ""),







        )















        db.add(analysis)















    resume.processing_status = "parsed"

    create_notification(
        db,
        user_id=current_user.id,
        notification_type="resume_parsed",
        title="Resume ready",
        message=f"{resume.original_filename} has been parsed and is ready for analysis.",
    )















    try:







        db.commit()







        db.refresh(analysis)















    except Exception as exc:







        db.rollback()















        raise HTTPException(







            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,







            detail="Failed to save parsed resume data.",







        ) from exc















    return {







        "resume_id": resume.id,







        "filename": resume.original_filename,







        **parsed_data,







    }























# ============================================================







# 9. Generate + Save AI Analysis







# ============================================================















@router.post(







    "/{resume_id}/ai-test",







    response_model=AIAnalysisResponse,







)







def test_ai_resume_analysis(







    resume_id: int,







    current_user: User = Depends(get_current_user),







    db: Session = Depends(get_db),







):







    """







    Generate a structured Gemini AI analysis.















    The newest result is saved in AIAnalysis.















    Every analysis run is also saved in AIAnalysisHistory.







    """















    resume = (







        db.query(Resume)







        .filter(







            Resume.id == resume_id,







            Resume.user_id == current_user.id,







        )







        .first()







    )















    if resume is None:







        raise HTTPException(







            status_code=status.HTTP_404_NOT_FOUND,







            detail="Resume not found.",







        )















    analysis = (







        db.query(ResumeAnalysis)







        .filter(







            ResumeAnalysis.resume_id == resume.id,







        )







        .first()







    )















    if analysis is None:







        raise HTTPException(







            status_code=status.HTTP_404_NOT_FOUND,







            detail="Resume has not been parsed yet.",







        )















    try:







        # ----------------------------------------------------







        # Generate new Gemini analysis







        # ----------------------------------------------------















        ai_result = analyze_resume_text(







            analysis.extracted_text







        )















        # ----------------------------------------------------







        # Get latest AI analysis







        # ----------------------------------------------------















        saved_analysis = (







            db.query(AIAnalysis)







            .filter(







                AIAnalysis.resume_id == resume.id,







            )







            .first()







        )















        # ----------------------------------------------------







        # Create latest analysis if needed







        # ----------------------------------------------------















        if saved_analysis is None:







            saved_analysis = AIAnalysis(







                resume_id=resume.id,







                overall_score=ai_result.overall_score,







                ats_score=ai_result.ats_score,







                technical_score=ai_result.technical_score,







                project_score=ai_result.project_score,







                content_score=ai_result.content_score,







                strengths=ai_result.strengths,







                weaknesses=ai_result.weaknesses,







                missing_skills=ai_result.missing_skills,







                recommendations=ai_result.recommendations,







                ai_feedback=ai_result.ai_feedback,







            )















            db.add(saved_analysis)















        # ----------------------------------------------------







        # Update latest analysis







        # ----------------------------------------------------















        else:







            saved_analysis.overall_score = (







                ai_result.overall_score







            )















            saved_analysis.ats_score = (







                ai_result.ats_score







            )















            saved_analysis.technical_score = (







                ai_result.technical_score







            )















            saved_analysis.project_score = (







                ai_result.project_score







            )















            saved_analysis.content_score = (







                ai_result.content_score







            )















            saved_analysis.strengths = (







                ai_result.strengths







            )















            saved_analysis.weaknesses = (







                ai_result.weaknesses







            )















            saved_analysis.missing_skills = (







                ai_result.missing_skills







            )















            saved_analysis.recommendations = (







                ai_result.recommendations







            )















            saved_analysis.ai_feedback = (







                ai_result.ai_feedback







            )















        # ----------------------------------------------------







        # Save analysis history snapshot







        # ----------------------------------------------------















        history_entry = AIAnalysisHistory(







            resume_id=resume.id,







            overall_score=ai_result.overall_score,







            ats_score=ai_result.ats_score,







            technical_score=ai_result.technical_score,







            project_score=ai_result.project_score,







            content_score=ai_result.content_score,







            strengths=ai_result.strengths,







            weaknesses=ai_result.weaknesses,







            missing_skills=ai_result.missing_skills,







            recommendations=ai_result.recommendations,







            ai_feedback=ai_result.ai_feedback,







        )















        db.add(history_entry)

        create_notification(
            db,
            user_id=current_user.id,
            notification_type="ai_analysis_completed",
            title="AI analysis completed",
            message=f"Your AI analysis for {resume.original_filename} is ready.",
        )















        # ----------------------------------------------------







        # Commit latest analysis + history together







        # ----------------------------------------------------















        db.commit()















        db.refresh(saved_analysis)















        return saved_analysis















    except Exception as exc:







        db.rollback()















        raise HTTPException(







            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,







            detail=f"AI analysis failed: {str(exc)}",







        ) from exc























#============================================================







# 10. Get Saved AI Analysis







#============================================================















@router.get(







    "/{resume_id}/ai-analysis",







    response_model=AIAnalysisResponse,







)







def get_resume_ai_analysis(

    resume_id: int,

    current_user: User = Depends(get_current_user),

    db: Session = Depends(get_db),

):

    """Return the persisted latest AI analysis."""



    resume = (

        db.query(Resume)

        .filter(

            Resume.id == resume_id,

            Resume.user_id == current_user.id,

        )

        .first()

    )



    if resume is None:

        raise HTTPException(

            status_code=status.HTTP_404_NOT_FOUND,

            detail="Resume not found.",

        )



    ai_analysis = (

        db.query(AIAnalysis)

        .filter(AIAnalysis.resume_id == resume.id)

        .first()

    )



    if ai_analysis is None:

        raise HTTPException(

            status_code=status.HTTP_404_NOT_FOUND,

            detail="AI analysis not found. Analyze the resume first.",

        )



    return ai_analysis





@router.get(







    "/{resume_id}/analysis-history",







    response_model=list[AIAnalysisHistoryResponse],







)







def get_analysis_history(







    resume_id: int,







    current_user: User = Depends(get_current_user),







    db: Session = Depends(get_db),







):







    """







    Return all AI analysis runs for a resume.















    Results are ordered newest first.







    """















    # --------------------------------------------------------







    # Verify resume ownership







    # --------------------------------------------------------















    resume = (







        db.query(Resume)







        .filter(







            Resume.id == resume_id,







            Resume.user_id == current_user.id,







        )







        .first()







    )















    if resume is None:







        raise HTTPException(







            status_code=status.HTTP_404_NOT_FOUND,







            detail="Resume not found.",







        )















    # --------------------------------------------------------







    # Retrieve history







    # --------------------------------------------------------















    history = (







        db.query(AIAnalysisHistory)







        .filter(







            AIAnalysisHistory.resume_id == resume.id,







        )







        .order_by(







            AIAnalysisHistory.created_at.desc(),







        )







        .all()







    )















    return history















# ============================================================







# 12. Compare AI Analysis History







# ============================================================























@router.get(







    "/{resume_id}/analysis-history/compare",







    response_model=AIAnalysisComparisonResponse,







)







def compare_analysis_history(







    resume_id: int,







    current_user: User = Depends(get_current_user),







    db: Session = Depends(get_db),







):







    """







    Compare the latest AI analysis with the previous AI analysis.







    """















    # --------------------------------------------------------







    # Verify resume ownership







    # --------------------------------------------------------















    resume = (







        db.query(Resume)







        .filter(







            Resume.id == resume_id,







            Resume.user_id == current_user.id,







        )







        .first()







    )















    if resume is None:







        raise HTTPException(







            status_code=status.HTTP_404_NOT_FOUND,







            detail="Resume not found.",







        )















    # --------------------------------------------------------







    # Get latest two analysis history records







    # --------------------------------------------------------















    history = (







        db.query(AIAnalysisHistory)







        .filter(







            AIAnalysisHistory.resume_id == resume.id,







        )







        .order_by(







            AIAnalysisHistory.created_at.desc(),







        )







        .limit(2)







        .all()







    )















    # --------------------------------------------------------







    # Require at least two analysis runs







    # --------------------------------------------------------















    if len(history) < 2:







        raise HTTPException(







            status_code=status.HTTP_400_BAD_REQUEST,







            detail=(







                "At least two AI analysis runs are required "







                "to compare results."







            ),







        )















    latest = history[0]







    previous = history[1]















    # --------------------------------------------------------







    # Calculate score changes







    # --------------------------------------------------------















    overall_score_change = (







        latest.overall_score - previous.overall_score







    )















    ats_score_change = (







        latest.ats_score - previous.ats_score







    )















    technical_score_change = (







        latest.technical_score - previous.technical_score







    )















    project_score_change = (







        latest.project_score - previous.project_score







    )















    content_score_change = (







        latest.content_score - previous.content_score







    )















    # --------------------------------------------------------







    # Return comparison







    # --------------------------------------------------------















    return {







        "resume_id": resume.id,















        "latest": latest,















        "previous": previous,















        "overall_score_change": overall_score_change,















        "ats_score_change": ats_score_change,















        "technical_score_change": technical_score_change,















        "project_score_change": project_score_change,















        "content_score_change": content_score_change,















        "overall_improved": overall_score_change > 0,















        "ats_improved": ats_score_change > 0,















        "technical_improved": technical_score_change > 0,















        "project_improved": project_score_change > 0,















        "content_improved": content_score_change > 0,







    }







# ============================================================



# 13. Create Job Match



# ============================================================











@router.post(



    "/{resume_id}/job-match",



    response_model=JobMatchResponse,



    status_code=status.HTTP_201_CREATED,



)



def create_job_match(



    resume_id: int,



    payload: JobMatchCreate,



    current_user: User = Depends(get_current_user),



    db: Session = Depends(get_db),



):



    """Compare a parsed resume against a specific job description using Gemini."""



    resume = (



        db.query(Resume)



        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)



        .first()



    )



    if resume is None:



        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")







    analysis = (



        db.query(ResumeAnalysis)



        .filter(ResumeAnalysis.resume_id == resume.id)



        .first()



    )



    if analysis is None:



        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Resume has not been parsed yet. Parse the resume before creating a job match.")



    if not analysis.extracted_text.strip():



        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parsed resume text is empty.")







    try:



        ai_result = analyze_job_match(



            resume_text=analysis.extracted_text,



            job_title=payload.job_title,



            job_description=payload.job_description,



        )



    except ValueError as exc:



        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc



    except Exception as exc:



        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Job matching service failed: {str(exc)}") from exc







    job_match = JobMatch(



        resume_id=resume_id,



        job_title=payload.job_title,



        company_name=payload.company_name,



        job_description=payload.job_description,



        match_score=ai_result.match_score,



        matching_skills=ai_result.matching_skills,



        missing_skills=ai_result.missing_skills,



        matching_keywords=ai_result.matching_keywords,



        missing_keywords=ai_result.missing_keywords,



        recommendations=ai_result.recommendations,



    )







    try:



        db.add(job_match)

        create_notification(
            db,
            user_id=current_user.id,
            notification_type="job_match_completed",
            title="Job match completed",
            message=(
                f'Your resume was matched against "{payload.job_title}" '
                f"with a score of {ai_result.match_score}."
            ),
        )



        db.commit()



        db.refresh(job_match)



    except Exception as exc:



        db.rollback()



        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save job match.") from exc







    return job_match







# ============================================================



# 14. Get Job Match History



# ============================================================







@router.get(



    "/{resume_id}/job-matches",



    response_model=JobMatchListResponse,



)



def get_job_matches(



    resume_id: int,



    current_user: User = Depends(get_current_user),



    db: Session = Depends(get_db),



):



    """Return all saved job matches for one resume."""







    resume = (



        db.query(Resume)



        .filter(



            Resume.id == resume_id,



            Resume.user_id == current_user.id,



        )



        .first()



    )







    if resume is None:



        raise HTTPException(



            status_code=status.HTTP_404_NOT_FOUND,



            detail="Resume not found.",



        )







    job_matches = (



        db.query(JobMatch)



        .filter(JobMatch.resume_id == resume.id)



        .order_by(JobMatch.created_at.desc())



        .all()



    )







    return JobMatchListResponse(



        total=len(job_matches),



        items=job_matches,



    )







# ============================================================



# 17. Get Job Match Statistics



# ============================================================







@router.get(



    "/{resume_id}/job-matches/statistics",



    response_model=JobMatchStatisticsResponse,



)



def get_job_match_statistics(



    resume_id: int,



    current_user: User = Depends(get_current_user),



    db: Session = Depends(get_db),



):



    """Return statistics for all saved job matches of one resume."""







    resume = (



        db.query(Resume)



        .filter(



            Resume.id == resume_id,



            Resume.user_id == current_user.id,



        )



        .first()



    )







    if resume is None:



        raise HTTPException(



            status_code=status.HTTP_404_NOT_FOUND,



            detail="Resume not found.",



        )







    statistics = (



        db.query(



            func.count(JobMatch.id).label("total_matches"),



            func.avg(JobMatch.match_score).label("average_score"),



            func.max(JobMatch.match_score).label("highest_score"),



            func.min(JobMatch.match_score).label("lowest_score"),



        )



        .filter(JobMatch.resume_id == resume.id)



        .first()



    )







    total_matches = int(statistics.total_matches or 0)







    if total_matches == 0:



        return JobMatchStatisticsResponse(



            total_matches=0,



            average_score=0.0,



            highest_score=0,



            lowest_score=0,



            strong_matches=0,



            moderate_matches=0,



            weak_matches=0,



        )







    strong_matches = (



        db.query(func.count(JobMatch.id))



        .filter(



            JobMatch.resume_id == resume.id,



            JobMatch.match_score >= 75,



        )



        .scalar()



        or 0



    )







    moderate_matches = (



        db.query(func.count(JobMatch.id))



        .filter(



            JobMatch.resume_id == resume.id,



            JobMatch.match_score >= 60,



            JobMatch.match_score < 75,



        )



        .scalar()



        or 0



    )







    weak_matches = (



        db.query(func.count(JobMatch.id))



        .filter(



            JobMatch.resume_id == resume.id,



            JobMatch.match_score < 60,



        )



        .scalar()



        or 0



    )







    return JobMatchStatisticsResponse(



        total_matches=total_matches,



        average_score=round(float(statistics.average_score or 0), 2),



        highest_score=int(statistics.highest_score or 0),



        lowest_score=int(statistics.lowest_score or 0),



        strong_matches=int(strong_matches),



        moderate_matches=int(moderate_matches),



        weak_matches=int(weak_matches),



    )











# ============================================================



# 15. Get Job Match Detail



# ============================================================







@router.get(



    "/{resume_id}/job-matches/{job_match_id}",



    response_model=JobMatchResponse,



)



def get_job_match_detail(



    resume_id: int,



    job_match_id: int,



    current_user: User = Depends(get_current_user),



    db: Session = Depends(get_db),



):



    """Return one saved job match for a resume."""







    resume = (



        db.query(Resume)



        .filter(



            Resume.id == resume_id,



            Resume.user_id == current_user.id,



        )



        .first()



    )







    if resume is None:



        raise HTTPException(



            status_code=status.HTTP_404_NOT_FOUND,



            detail="Resume not found.",



        )







    job_match = (



        db.query(JobMatch)



        .filter(



            JobMatch.id == job_match_id,



            JobMatch.resume_id == resume.id,



        )



        .first()



    )







    if job_match is None:



        raise HTTPException(



            status_code=status.HTTP_404_NOT_FOUND,



            detail="Job match not found.",



        )







    return job_match







# ============================================================



# 16. Delete Job Match



# ============================================================







@router.delete(



    "/{resume_id}/job-matches/{job_match_id}",



    status_code=status.HTTP_204_NO_CONTENT,



)



def delete_job_match(



    resume_id: int,



    job_match_id: int,



    current_user: User = Depends(get_current_user),



    db: Session = Depends(get_db),



):



    """Delete one saved job match for a resume."""







    resume = (



        db.query(Resume)



        .filter(



            Resume.id == resume_id,



            Resume.user_id == current_user.id,



        )



        .first()



    )







    if resume is None:



        raise HTTPException(



            status_code=status.HTTP_404_NOT_FOUND,



            detail="Resume not found.",



        )







    job_match = (



        db.query(JobMatch)



        .filter(



            JobMatch.id == job_match_id,



            JobMatch.resume_id == resume.id,



        )



        .first()



    )







    if job_match is None:



        raise HTTPException(



            status_code=status.HTTP_404_NOT_FOUND,



            detail="Job match not found.",



        )







    try:



        db.delete(job_match)



        db.commit()



    except Exception as exc:



        db.rollback()



        raise HTTPException(



            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,



            detail="Failed to delete job match.",



        ) from exc







    return None




