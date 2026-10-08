import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import settings
from app.database.base import Base
from app.database.connection import engine
from app import models

from app.routes.auth import router as auth_router
from app.routes.resume import router as resume_router

from app.routes.notifications import router as notifications_router

logger = logging.getLogger("resumeiq")


# ============================================================
# Application
# ============================================================

docs_url = "/docs" if settings.ENABLE_API_DOCS else None
redoc_url = "/redoc" if settings.ENABLE_API_DOCS else None
openapi_url = "/openapi.json" if settings.ENABLE_API_DOCS else None

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered resume analysis and job matching platform.",
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url,
)


# ============================================================
# Database Table Initialization
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# Routers
# ============================================================

app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(notifications_router)


# ============================================================
# Trusted Hosts
# ============================================================

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.allowed_hosts,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Accept",
        "Authorization",
        "Content-Type",
    ],
)


# ============================================================
# Request Size Protection
# ============================================================

@app.middleware("http")
async def request_size_limit_middleware(
    request: Request,
    call_next,
):
    content_length = request.headers.get("content-length")

    if content_length:
        try:
            request_size = int(content_length)
        except ValueError:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": {
                        "code": "INVALID_CONTENT_LENGTH",
                        "message": "Invalid request size.",
                    },
                },
            )

        if request_size > settings.max_request_body_size_bytes:
            return JSONResponse(
                status_code=413,
                content={
                    "success": False,
                    "error": {
                        "code": "REQUEST_TOO_LARGE",
                        "message": "Request payload is too large.",
                    },
                },
            )

    return await call_next(request)


# ============================================================
# Security Response Headers
# ============================================================

@app.middleware("http")
async def security_headers_middleware(
    request: Request,
    call_next,
):
    response = await call_next(request)

    if settings.ENABLE_SECURITY_HEADERS:
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = (
            "strict-origin-when-cross-origin"
        )
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )

    return response


# ============================================================
# Global Exception Handlers
# ============================================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    errors = []

    for error in exc.errors():
        errors.append(
            {
                "loc": list(error.get("loc", [])),
                "message": error.get(
                    "msg",
                    "Invalid request value.",
                ),
                "type": error.get(
                    "type",
                    "validation_error",
                ),
            }
        )

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed.",
                "details": errors,
            },
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception,
):
    logger.exception(
        "Unhandled application error: %s %s (%s)",
        request.method,
        request.url.path,
        type(exc).__name__,
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred.",
            },
        },
    )


# ============================================================
# Root
# ============================================================

@app.get("/")
async def root():
    return {
        "message": "Welcome to ResumeIQ API",
        "version": settings.APP_VERSION,
        "status": "running",
    }


# ============================================================
# Health Check
# ============================================================

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ResumeIQ API",
    }


# ============================================================
# Database Health Check
# ============================================================

@app.get("/api/v1/health/database")
async def database_health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception:
        logger.exception("Database health check failed.")

        return {
            "status": "unhealthy",
            "database": "disconnected",
        }
