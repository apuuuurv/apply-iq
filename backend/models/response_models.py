"""
Response models for Resume Analyzer API.

This module defines Pydantic models for type-safe API responses.
These models ensure consistent data structure and enable automatic
OpenAPI documentation generation.
"""

from pydantic import BaseModel, Field
from typing import List


class SkillGap(BaseModel):
    """Model for a missing skill with its weight/importance."""
    skill: str
    weight: float = Field(..., ge=0, le=100)
    is_critical: bool = False

class ResumeAnalysisResponse(BaseModel):
    """
    Enhanced response model for resume analysis.
    """
    
    match_score: float = Field(
        ..., 
        ge=0, 
        le=100,
        description="Semantic match score (0-100%)"
    )
    
    resume_skills: List[str] = Field(
        default_factory=list,
        description="All skills found in resume"
    )
    
    jd_skills: List[str] = Field(
        default_factory=list,
        description="All skills found in job description"
    )
    
    matched_skills: List[str] = Field(
        default_factory=list,
        description="Intersection of resume and JD skills"
    )
    
    tech_stack_matches: List[str] = Field(
        default_factory=list,
        description="Technical skills found in both"
    )
    
    secondary_matches: List[str] = Field(
        default_factory=list,
        description="Secondary/Soft skills found in both"
    )
    
    missing_skills: List[SkillGap] = Field(
        default_factory=list,
        description="Detailed list of missing skills with weights"
    )
    
    skill_gap_summary: str = Field(
        default="",
        description="Human-readable summary of the skill gap"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "match_score": 85.5,
                "resume_skills": ["Python", "FastAPI", "PostgreSQL"],
                "jd_skills": ["Python", "FastAPI", "Docker"],
                "matched_skills": ["Python", "FastAPI"],
                "tech_stack_matches": ["Python", "FastAPI"],
                "secondary_matches": [],
                "missing_skills": [
                    {"skill": "Docker", "weight": 100.0, "is_critical": True}
                ],
                "skill_gap_summary": "Your resume covers 80% of the tech stack. You are missing critical devops tools (Docker)."
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
