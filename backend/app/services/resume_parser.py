from pathlib import Path
import re

import fitz
from docx import Document


SUPPORTED_EXTENSIONS = {".pdf", ".docx"}


def extract_pdf_text(file_path: Path) -> str:
    """Extract text from a PDF file."""

    text_parts: list[str] = []

    with fitz.open(file_path) as document:
        for page in document:
            page_text = page.get_text("text")

            if page_text:
                text_parts.append(page_text)

    return "\n".join(text_parts)


def extract_docx_text(file_path: Path) -> str:
    """Extract text from a DOCX file."""

    document = Document(file_path)

    paragraphs = [
        paragraph.text.strip()
        for paragraph in document.paragraphs
        if paragraph.text.strip()
    ]

    return "\n".join(paragraphs)


def extract_text(file_path: Path) -> str:
    """Extract text based on the resume file extension."""

    extension = file_path.suffix.lower()

    if extension == ".pdf":
        return extract_pdf_text(file_path)

    if extension == ".docx":
        return extract_docx_text(file_path)

    raise ValueError(
        "Unsupported file format. Only PDF and DOCX are supported."
    )


def clean_text(text: str) -> str:
    """Normalize extracted resume text."""

    text = text.replace("\x00", " ")

    # Normalize Windows line endings.
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Remove excessive spaces while preserving line structure.
    text = re.sub(r"[ \t]+", " ", text)

    # Remove excessive blank lines.
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


SECTION_ALIASES = {
    "summary": {
        "summary",
        "professional summary",
        "profile",
        "career objective",
        "objective",
        "about me",
    },
    "skills": {
        "skills",
        "technical skills",
        "core skills",
        "technical expertise",
        "skills & technologies",
    },
    "experience": {
        "experience",
        "work experience",
        "professional experience",
        "employment",
        "work history",
    },
    "education": {
        "education",
        "academic background",
        "academic qualifications",
        "qualifications",
    },
    "projects": {
        "projects",
        "personal projects",
        "academic projects",
        "key projects",
    },
    "certifications": {
        "certifications",
        "certificates",
        "licenses & certifications",
        "certification",
    },
}


def normalize_heading(line: str) -> str:
    """Normalize a possible section heading."""

    line = line.strip().lower()

    line = re.sub(r"[^a-z0-9&\s]", "", line)
    line = re.sub(r"\s+", " ", line)

    return line


def detect_section(line: str) -> str | None:
    """Return the internal section name for a known heading."""

    normalized = normalize_heading(line)

    for section_name, aliases in SECTION_ALIASES.items():
        if normalized in aliases:
            return section_name

    return None


def extract_sections(text: str) -> dict[str, str]:
    """Split resume text into recognized sections."""

    sections = {
        "summary": "",
        "skills": "",
        "experience": "",
        "education": "",
        "projects": "",
        "certifications": "",
    }

    current_section: str | None = None

    for line in text.splitlines():
        line = line.strip()

        if not line:
            continue

        detected_section = detect_section(line)

        if detected_section:
            current_section = detected_section
            continue

        if current_section:
            if sections[current_section]:
                sections[current_section] += "\n"

            sections[current_section] += line

    return sections


COMMON_SKILLS = [
    "Python",
    "Java",
    "JavaScript",
    "TypeScript",
    "C",
    "C++",
    "HTML",
    "CSS",
    "React",
    "React.js",
    "Node.js",
    "FastAPI",
    "Flask",
    "Django",
    "SQL",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "Docker",
    "Git",
    "GitHub",
    "REST API",
    "REST APIs",
    "AWS",
    "Azure",
    "Google Cloud",
    "Machine Learning",
    "Deep Learning",
    "NLP",
    "Natural Language Processing",
    "Pandas",
    "NumPy",
    "Scikit-learn",
    "TensorFlow",
    "PyTorch",
    "SQLAlchemy",
    "Power BI",
]


def extract_skills(text: str) -> list[str]:
    """Detect known technical skills in resume text."""

    detected_skills: list[str] = []

    normalized_text = text.lower()

    for skill in COMMON_SKILLS:
        if skill.lower() in normalized_text:
            detected_skills.append(skill)

    return detected_skills


def extract_contact_information(text: str) -> dict[str, str | None]:
    """Extract basic contact information."""

    email_match = re.search(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        text,
    )

    phone_match = re.search(
        r"(?<!\d)(?:\+91[\s-]?)?[6-9]\d{9}(?!\d)",
        text,
    )

    return {
        "email": email_match.group(0) if email_match else None,
        "phone": phone_match.group(0) if phone_match else None,
    }


def parse_resume(file_path: str | Path) -> dict:
    """Parse a PDF or DOCX resume into structured data."""

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Resume file not found: {path}"
        )

    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            "Unsupported file format. Only PDF and DOCX are supported."
        )

    raw_text = extract_text(path)
    cleaned_text = clean_text(raw_text)

    if not cleaned_text:
        raise ValueError(
            "No readable text was found in the resume."
        )

    sections = extract_sections(cleaned_text)
    skills = extract_skills(cleaned_text)
    contact = extract_contact_information(cleaned_text)

    return {
        "contact": contact,
        "skills": skills,
        "sections": sections,
        "full_text": cleaned_text,
    }