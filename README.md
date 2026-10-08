# ResumeIQ

> **AI-powered resume analysis and job matching platform**

ResumeIQ is a full-stack web application that helps users understand and improve their resumes through automated resume parsing, AI-powered analysis, resume history, job matching, analytics, and account management.

## Overview

ResumeIQ combines a React frontend with a FastAPI backend, PostgreSQL persistence, and Google Gemini-powered analysis. Users can create an account, upload a resume, extract structured resume information, receive an AI-generated evaluation, review analysis history, compare previous analyses, and evaluate job matches.

## Key Features

### Authentication & Account
- User registration and login
- JWT-based authentication
- Protected user data and resume operations
- Account settings
- Confirmation-based sign out

### Resume Management
- Upload resumes in **PDF** and **DOCX** formats
- Resume text extraction and cleaning
- Section detection and normalization
- Contact information extraction
- Skill extraction
- Resume list, detail, preview, download, and deletion
- Resume processing/status tracking

### AI Resume Analysis
- Google Gemini-powered resume analysis
- Overall resume score
- ATS-focused evaluation
- Technical skills evaluation
- Projects evaluation
- Content evaluation
- Actionable improvement feedback
- Analysis history
- Historical analysis comparison

### Job Matching
- Job-match analysis using Gemini
- Match scoring and analysis details
- Job-match history
- Job-match statistics
- Job-match deletion

### Dashboard & Analytics
- Resume dashboard
- Resume statistics
- Analytics view
- Analysis and matching insights

### Notifications
- Persistent notifications
- Read/unread notification state
- Mark individual notifications as read
- Mark all notifications as read
- Clear read notifications

### UI / UX
- Responsive React interface
- Dark and light themes
- Toast notifications
- Reusable UI components
- Responsive dashboard layout

## Tech Stack

### Frontend
- React 19
- Vite
- React Router
- Axios
- Lucide React
- DM Sans / Space Grotesk
- CSS
- Oxlint

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic / Pydantic Settings
- PostgreSQL
- JWT authentication
- python-dotenv
- PyMuPDF
- python-docx
- Google GenAI SDK

### AI
- Google Gemini
- Gemini-powered resume analysis
- Gemini-powered job matching

## Architecture

```text
┌───────────────────────────┐
│       React Frontend      │
│                           │
│ Landing / Auth /          │
│ Dashboard / Resumes /     │
│ Analysis / Job Matching / │
│ Analytics / Settings      │
└─────────────┬─────────────┘
              │ HTTP / JSON
              ▼
┌───────────────────────────┐
│       FastAPI Backend     │
│                           │
│ Auth API                  │
│ Resume API                │
│ Notification API          │
│ Resume Processing         │
│ AI Analysis               │
│ Job Matching              │
└───────┬─────────┬─────────┘
        │         │
        ▼         ▼
┌────────────┐  ┌────────────────┐
│ PostgreSQL │  │ Google Gemini  │
│ Database   │  │ AI Services    │
└────────────┘  └────────────────┘
```

## Application Workflow

```text
Register / Login
       │
       ▼
Upload Resume (PDF/DOCX)
       │
       ▼
Extract & Parse Resume Text
       │
       ▼
Structured Resume Data
       │
       ▼
Gemini AI Analysis
       │
       ├──────────────► Resume Score & Feedback
       │
       ├──────────────► Analysis History
       │
       └──────────────► Job Matching
```

## Project Structure

```text
ResumeIQ/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

## API Areas

The backend exposes APIs for:

- Authentication
- Resume upload and management
- Resume parsing
- Resume AI analysis
- Analysis history and comparison
- Job matching
- Notifications
- Health checks

When API documentation is enabled, FastAPI provides:

- `/docs` — Swagger UI
- `/redoc` — ReDoc
- `/openapi.json` — OpenAPI specification

## Local Setup

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd ResumeIQ
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

macOS / Linux:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your environment file:

```bash
copy .env.example .env
```

For macOS / Linux:

```bash
cp .env.example .env
```

Set the PostgreSQL connection string, JWT secret, Gemini API key, and frontend/CORS configuration in `.env`.

Start the API:

```bash
uvicorn app.main:app --reload
```

The API runs locally at:

```text
http://localhost:8000
```

### 3. Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
```

Create the environment file:

```bash
copy .env.example .env
```

For macOS / Linux:

```bash
cp .env.example .env
```

Start the frontend:

```bash
npm run dev
```

The Vite development server runs at:

```text
http://localhost:5173
```

## Environment Variables

### Backend

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | JWT signing secret |
| `JWT_ALGORITHM` | JWT algorithm |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime |
| `GEMINI_API_KEY` | Google Gemini API key |
| `FRONTEND_URL` | Frontend origin |
| `CORS_ORIGINS` | Additional allowed origins |
| `ALLOWED_HOSTS` | Trusted backend hosts |
| `MAX_REQUEST_BODY_SIZE_MB` | Request size limit |
| `ENABLE_API_DOCS` | Enable FastAPI docs |
| `ENABLE_SECURITY_HEADERS` | Enable security response headers |

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | FastAPI backend base URL |

**Never commit real `.env` files or API keys to GitHub.**

## Security

ResumeIQ includes several backend protections, including:

- JWT authentication
- Password hashing
- CORS configuration
- Trusted-host validation
- Request body size protection
- Security response headers
- Input validation through Pydantic
- Centralized exception handling
- Environment-based secret configuration

## Health Checks

The backend provides health endpoints for service and database connectivity:

```text
GET /api/v1/health
GET /api/v1/health/database
```

## Frontend Routes

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/login` | Login |
| `/register` | Registration |
| `/dashboard` | Main dashboard |
| `/resumes` | Resume management |
| `/analysis` | Resume analysis |
| `/job-matches` | Job matching |
| `/job-matching` | Backward-compatible job matching route |
| `/analytics` | Analytics |
| `/settings` | Account settings |

## Screenshots

Add production screenshots here after the final GitHub repository is prepared.

Recommended screenshots:

1. Landing page
2. Login / registration
3. Dashboard
4. Resume upload / management
5. AI analysis
6. Job matching
7. Analytics
8. Settings
9. Dark mode
10. Mobile responsive view

Example:

```markdown
![ResumeIQ Dashboard](screenshots/dashboard.png)
```

## Deployment

The application can be deployed as separate frontend, backend, and database services.

Recommended production setup:

```text
Frontend  → Vercel
Backend   → Render
Database  → PostgreSQL / Neon
AI        → Google Gemini API
```

Before production deployment, configure production environment variables and CORS origins for the deployed frontend/backend URLs.

## Future Enhancements

Potential future improvements include:

- More resume file formats
- Additional job-board integrations
- Advanced resume versioning
- More detailed skill-gap analysis
- Exportable analysis reports
- Additional AI providers
- Automated job recommendations

## License

This project is currently presented as a portfolio/project application. Add your preferred license before publishing the repository if required.

## Author

**Yash Bora**

Computer Science & Engineering student and developer building full-stack and AI-powered applications.

---

**ResumeIQ — Analyze smarter. Improve faster.**
