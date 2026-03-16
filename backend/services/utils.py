"""
Utility functions for the Resume Analyzer backend.

This module contains helper functions for logging, text cleaning,
and other common operations.
"""

import logging
import re
from typing import List
import os


def setup_logging(log_level: str = "INFO") -> logging.Logger:
    """
    Configure logging for the application.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR)
        
    Returns:
        Configured logger instance
    """
    logging.basicConfig(
        level=getattr(logging, log_level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    return logging.getLogger(__name__)


logger = setup_logging()


def clean_text(text: str) -> str:
    """
    Clean resume or job description text.
    
    Operations performed:
    - Convert to lowercase
    - Remove extra whitespace
    - Remove special characters (keeping alphanumeric, spaces, hyphens)
    
    Args:
        text: Raw text to clean
        
    Returns:
        Cleaned text
    """
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Convert to lowercase
    text = text.lower()
    
    return text.strip()


def normalize_skill(skill: str) -> str:
    """
    Normalize a skill string for consistent matching.
    
    Operations:
    - Convert to lowercase
    - Strip whitespace
    - Remove special characters
    
    Args:
        skill: Raw skill string
        
    Returns:
        Normalized skill
    """
    # Remove special characters and extra whitespace
    skill = re.sub(r'[^a-z0-9\s+#\.]', '', skill.lower())
    return skill.strip()


def validate_file_path(file_path: str, allowed_extensions: List[str]) -> bool:
    """
    Validate if file exists and has allowed extension.
    
    Args:
        file_path: Path to the file
        allowed_extensions: List of allowed file extensions (e.g., ['.pdf', '.docx'])
        
    Returns:
        True if valid, False otherwise
    """
    if not os.path.exists(file_path):
        logger.warning(f"File not found: {file_path}")
        return False
    
    _, ext = os.path.splitext(file_path)
    if ext.lower() not in allowed_extensions:
        logger.warning(f"Invalid file extension: {ext}")
        return False
    
    return True


def get_file_extension(filename: str) -> str:
    """
    Extract file extension from filename.
    
    Args:
        filename: Name of the file
        
    Returns:
        File extension (lowercase, with dot)
    """
    return os.path.splitext(filename)[1].lower()
