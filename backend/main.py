"""
Resume Analyzer API - FastAPI Backend

A production-ready API for analyzing resumes against job descriptions
using NLP and semantic similarity matching.

Features:
- Resume file upload (PDF/DOCX)
- Skill extraction from resume and job description
- Semantic similarity matching using sentence-transformers
- Skill gap analysis

Endpoints:
- POST /analyze: Main analysis endpoint
- GET /health: Health check
- GET /docs: Auto-generated API documentation

Architecture:
- FastAPI for async HTTP server
- spaCy for NLP skill extraction
- sentence-transformers for semantic matching
- Pydantic for data validation
- CORS enabled for frontend integration

Usage:
    python main.py
    # API available at http://localhost:8000
    # Docs at http://localhost:8000/docs
"""

import logging
import traceback
from typing import Optional
from pathlib import Path
import tempfile

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models.response_models import ResumeAnalysisResponse, ErrorResponse
from services.resume_parser import ResumeParser
from services.skill_extractor import SkillExtractor
from services.matcher import ResumeMatcher
from services.utils import setup_logging, get_file_extension, clean_text

# ============================================================================
# CONFIGURATION & SETUP
# ============================================================================

# Configure logging
logger = setup_logging("INFO")

# Initialize FastAPI app
app = FastAPI(
    title="Resume Analyzer API",
    description="AI-powered resume analysis against job descriptions",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ============================================================================
# CORS CONFIGURATION (For Frontend Integration)
# ============================================================================

# Allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Local development
        "http://localhost:3001",      # Alternative local port
        "http://127.0.0.1:3000",      # Localhost variant
        "*"                           # Allow all (for testing; restrict in production)
    ],
    allow_credentials=True,
    allow_methods=["*"],              # Allow all HTTP methods
    allow_headers=["*"],              # Allow all headers
)

# ============================================================================
# GLOBAL VARIABLES (Initialized on startup)
# ============================================================================

# These will be initialized when the app starts
resume_parser: Optional[ResumeParser] = None
skill_extractor: Optional[SkillExtractor] = None
resume_matcher: Optional[ResumeMatcher] = None


# ============================================================================
# APP STARTUP & SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """
    Initialize ML models and services on app startup.
    
    This runs once when the FastAPI server starts.
    Initializes:
    - spaCy NLP model
    - Skill extractor with skills database
    - Sentence-transformers model for semantic matching
    
    Note: Model loading takes 2-3 seconds on first startup,
    then models are cached in memory for fast requests.
    """
    global resume_parser, skill_extractor, resume_matcher
    
    try:
        logger.info("🚀 Starting Resume Analyzer API...")
        
        # Initialize components
        resume_parser = ResumeParser()
        logger.info("✓ Resume parser initialized")
        
        skill_extractor = SkillExtractor()
        logger.info("✓ Skill extractor initialized")
        
        resume_matcher = ResumeMatcher()
        logger.info("✓ Resume matcher initialized")
        
        logger.info("✓ All services initialized successfully")
        
    except Exception as e:
        logger.error(f"✗ Startup failed: {str(e)}")
        logger.error(traceback.format_exc())
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """
    Cleanup on app shutdown.
    
    Currently no cleanup needed, but this hook is available
    for future resource management (e.g., closing connections).
    """
    logger.info("🛑 Shutting down Resume Analyzer API")


# ============================================================================
# HEALTH CHECK ENDPOINT
# ============================================================================

@app.get(
    "/health",
    summary="Health Check",
    description="Check if API is running and services are available"
)
async def health_check():
    """
    Simple health check endpoint.
    
    Returns:
        Dict with status and service information
    """
    return {
        "status": "ok",
        "services": {
            "resume_parser": resume_parser is not None,
            "skill_extractor": skill_extractor is not None,
            "resume_matcher": resume_matcher is not None
        }
    }


# ============================================================================
# MAIN ANALYSIS ENDPOINT
# ============================================================================

@app.post(
    "/analyze",
    response_model=ResumeAnalysisResponse,
    summary="Analyze Resume vs Job Description",
    description="Upload a resume and provide job description for AI-powered analysis"
)
async def analyze_resume(
    file: UploadFile = File(
        ...,
        description="Resume file (PDF or DOCX)"
    ),
    job_description: str = Form(
        ...,
        description="Job description text",
        min_length=50,
        max_length=10000
    )
) -> ResumeAnalysisResponse:
    """
    Main API endpoint for resume analysis.
    
    Process:
    1. Validate file type (PDF or DOCX)
    2. Extract text from resume file
    3. Extract skills from resume using spaCy + skill list
    4. Extract skills from job description
    5. Compute semantic similarity (match score)
    6. Identify missing skills (gap analysis)
    
    Args:
        file: Resume file (PDF or DOCX format)
        job_description: Job description text
        
    Returns:
        ResumeAnalysisResponse containing:
        - match_score: 0-100% semantic similarity
        - resume_skills: Extracted skills from resume
        - jd_skills: Extracted skills from job description
        - missing_skills: Skills in JD but not in resume
        
    Raises:
        HTTPException: For validation or processing errors
        
    Example Request (using curl):
        curl -X POST "http://localhost:8000/analyze" \
          -F "file=@resume.pdf" \
          -F "job_description=We are looking for a Python developer..."
    """
    
    try:
        # ====== VALIDATION ======
        
        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        # Check file extension
        file_ext = get_file_extension(file.filename)
        supported_formats = [".pdf", ".docx", ".doc"]
        
        if file_ext not in supported_formats:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format: {file_ext}. Supported: {', '.join(supported_formats)}"
            )
        
        # Validate job description length
        if not job_description or len(job_description.strip()) < 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job description must be at least 50 characters"
            )
        
        logger.info(f"Processing file: {file.filename}")
        
        # ====== FILE PROCESSING ======
        
        # Save uploaded file to temporary location
        temp_file = None
        try:
            with tempfile.NamedTemporaryFile(
                suffix=file_ext,
                delete=False
            ) as tmp:
                contents = await file.read()
                tmp.write(contents)
                temp_file = tmp.name
            
            logger.info(f"Temporary file saved: {temp_file}")
            
            # ====== TEXT EXTRACTION ======
            
            logger.info("Extracting text from resume...")
            resume_text = resume_parser.parse_resume(
                temp_file,
                file_ext.lstrip('.')
            )
            logger.info(f"Extracted {len(resume_text)} characters from resume")
            
            # Clean extracted text
            resume_text = clean_text(resume_text)
            job_description_clean = clean_text(job_description)
            
            # ====== SKILL EXTRACTION ======
            
            logger.info("Extracting skills from resume...")
            resume_skills = skill_extractor.extract_skills(resume_text)
            
            logger.info("Extracting skills from job description...")
            jd_skills = skill_extractor.extract_skills(job_description_clean)
            
            # ====== SKILL GAP ANALYSIS ======
            
            # Find missing skills (skills in JD but not in resume)
            resume_skills_set = set(s.lower() for s in resume_skills)
            jd_skills_set = set(s.lower() for s in jd_skills)
            missing_skills_set = jd_skills_set - resume_skills_set
            missing_skills = sorted(list(missing_skills_set))
            
            logger.info(f"Missing skills: {missing_skills}")
            
            # ====== SEMANTIC MATCHING ======
            
            logger.info("Computing semantic similarity...")
            match_score, metadata = resume_matcher.compute_match_score(
                resume_text,
                job_description_clean
            )
            
            logger.info(f"Match score: {match_score:.2f}%")
            logger.info(f"Metadata: {metadata}")
            
            # ====== BUILD RESPONSE ======
            
            response = ResumeAnalysisResponse(
                match_score=round(match_score, 2),
                resume_skills=resume_skills,
                jd_skills=jd_skills,
                missing_skills=missing_skills
            )
            
            logger.info("✓ Analysis completed successfully")
            
            return response
        
        finally:
            # Clean up temporary file
            if temp_file:
                import os
                try:
                    os.unlink(temp_file)
                    logger.debug(f"Temporary file deleted: {temp_file}")
                except Exception as e:
                    logger.warning(f"Failed to delete temporary file: {str(e)}")
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(traceback.format_exc())
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during analysis. Check server logs for details."
        )


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """
    Custom HTTP exception handler.
    
    Formats error responses consistently.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "Request Error",
            "detail": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """
    Catch-all exception handler for unexpected errors.
    
    Logs the full traceback for debugging.
    """
    logger.error(f"Unhandled exception: {str(exc)}")
    logger.error(traceback.format_exc())
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred. Check server logs for details.",
            "status_code": 500
        }
    )


# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    """
    Run the FastAPI server.
    
    Command:
        python main.py
        
    Then access:
        - API: http://localhost:8000
        - Interactive docs: http://localhost:8000/docs
        - Alternative docs: http://localhost:8000/redoc
    """
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on file changes (development)
        log_level="info"
    )
