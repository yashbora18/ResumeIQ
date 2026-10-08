import json

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.core.config import settings


MODEL_NAME = "gemini-3.5-flash-lite"


class JobMatchAIResult(BaseModel):
    match_score: int = Field(
        ge=0,
        le=100,
        description="Overall resume-to-job match score from 0 to 100.",
    )

    matching_skills: list[str] = Field(
        default_factory=list,
        description="Skills explicitly supported by the resume and required by the job.",
    )

    missing_skills: list[str] = Field(
        default_factory=list,
        description="Important job-required skills not supported by the resume.",
    )

    matching_keywords: list[str] = Field(
        default_factory=list,
        description="Important job-description keywords clearly supported by the resume.",
    )

    missing_keywords: list[str] = Field(
        default_factory=list,
        description="Important job-description keywords not clearly represented in the resume.",
    )

    recommendations: list[str] = Field(
        default_factory=list,
        description="Specific, actionable recommendations based only on the resume and job description.",
    )


def get_gemini_client() -> genai.Client:
    return genai.Client(
        api_key=settings.GEMINI_API_KEY,
    )


def analyze_job_match(
    resume_text: str,
    job_title: str,
    job_description: str,
) -> JobMatchAIResult:
    if not resume_text.strip():
        raise ValueError("Resume text cannot be empty.")

    if not job_description.strip():
        raise ValueError("Job description cannot be empty.")

    prompt = f"""
You are an expert ATS and recruitment analysis engine.

Your task is to compare a candidate's resume against a specific job description.

JOB TITLE:
{job_title}

JOB DESCRIPTION:
{job_description}

CANDIDATE RESUME:
{resume_text}

STRICT RULES:

1. Base every conclusion ONLY on the supplied resume and job description.
2. NEVER invent experience, skills, technologies, certifications, projects,
   education, or achievements that are not present in the resume.
3. A skill counts as MATCHING only when the resume provides clear evidence
   that the candidate has that skill.
4. If a job requires a skill and the resume does not provide clear evidence
   for it, place that skill in missing_skills.
5. Do not assume that related technologies are identical.
   For example:
   - Python does not automatically mean Django.
   - JavaScript does not automatically mean React.
   - SQL does not automatically mean PostgreSQL.
   - AWS does not automatically mean Azure.
6. matching_keywords should contain important job-description terms that
   are clearly represented in the resume.
7. missing_keywords should contain important job-description terms that
   are not clearly represented in the resume.
8. Recommendations must be actionable and evidence-based.
9. Do not recommend falsely claiming a skill.
10. Keep lists concise and relevant.
11. match_score must be between 0 and 100.

SCORING GUIDELINE:

90-100:
Excellent match. The resume strongly satisfies the job requirements.

75-89:
Strong match. Most important requirements are supported.

60-74:
Moderate match. Several important requirements are supported,
but meaningful gaps exist.

40-59:
Weak match. Some relevant experience exists, but major requirements
are missing.

0-39:
Very weak match. The resume has limited alignment with the job.

Return ONLY the structured result matching the required schema.
"""

    client = get_gemini_client()

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.2,
            candidate_count=1,
            seed=42,
            response_mime_type="application/json",
            response_schema=JobMatchAIResult,
        ),
    )

    if getattr(response, "parsed", None) is not None:
        return JobMatchAIResult.model_validate(response.parsed)

    if not response.text:
        raise ValueError("Gemini returned an empty job-match response.")

    try:
        data = json.loads(response.text)
        return JobMatchAIResult.model_validate(data)
    except (json.JSONDecodeError, ValueError) as exc:
        raise ValueError(
            "Gemini returned an invalid job-match response."
        ) from exc