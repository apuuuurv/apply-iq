"""
Response models for Resume Analyzer API.

This module defines Pydantic models for type-safe API responses.
These models ensure consistent data structure and enable automatic
OpenAPI documentation generation.
"""

from pydantic import BaseModel, Field
from typing import List


class ResumeAnalysisResponse(BaseModel):
    """
    Main response model for resume analysis.
    
    This model encapsulates:
    - match_score: Cosine similarity score between resume and job description (0-100%)
    - resume_skills: Skills extracted from the resume text
    - jd_skills: Skills extracted from the job description
    - missing_skills: Skills in job description but not in resume
    
    The match_score is computed using sentence-transformers embeddings
    and cosine similarity, representing semantic alignment between
    resume and job requirements.
    """
    
    match_score: float = Field(
        ..., 
        ge=0, 
        le=100,
        description="Semantic match score between resume and job description (0-100%)"
    )
    
    resume_skills: List[str] = Field(
        default_factory=list,
        description="List of skills extracted from the resume"
    )
    
    jd_skills: List[str] = Field(
        default_factory=list,
        description="List of skills extracted from the job description"
    )
    
    missing_skills: List[str] = Field(
        default_factory=list,
        description="Skills in job description but not found in resume"
    )
    
    class Config:
        """Pydantic configuration for better API documentation."""
        json_schema_extra = {
            "example": {
                "match_score": 85.5,
                "resume_skills": ["Python", "FastAPI", "PostgreSQL"],
                "jd_skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
                "missing_skills": ["Docker"]
            }
        }


class ErrorResponse(BaseModel):
    """
    Error response model for API errors.
    
    Provides consistent error information to frontend.
    """
    
    error: str = Field(
        ...,
        description="Error message describing what went wrong"
    )
    
    detail: str = Field(
        default="",
        description="Additional details about the error"
    )
    
    status_code: int = Field(
        default=400,
        description="HTTP status code"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "Invalid file format",
                "detail": "Only PDF and DOCX files are supported",
                "status_code": 400
            }
        }
