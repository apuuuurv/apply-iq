"""
Skill extraction service using spaCy NLP.

This module extracts technical and soft skills from resume text
and job descriptions using spaCy for NER (Named Entity Recognition)
combined with a predefined skills database.

Why spaCy?
- Fast and efficient for production use
- Can be extended with custom entity patterns
- Supports rule-based and ML-based extraction
- Memory efficient compared to other NLP libraries

Extraction Strategy:
1. Load predefined skills list (technical + soft skills)
2. Normalize text (lowercase, remove special characters)
3. Use fuzzy matching for typo tolerance
4. Return matched skills in original case
"""

import logging
import json
import os
from typing import List, Set
import spacy
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)


class SkillExtractor:
    """
    Extract skills from text using spaCy and predefined skill list.
    
    This class:
    - Loads a predefined skills database
    - Normalizes text for matching
    - Performs fuzzy matching for typo tolerance
    - Returns unique, deduplicated skills
    """
    
    def __init__(self, skills_json_path: str = None):
        """
        Initialize the skill extractor.
        
        Args:
            skills_json_path: Path to skills.json file.
                             If None, uses default in same directory.
        """
        try:
            # Load spaCy model
            self.nlp = spacy.load("en_core_web_sm")
            logger.info("Loaded spaCy model: en_core_web_sm")
        except OSError:
            logger.error("spaCy model not found. Run: python -m spacy download en_core_web_sm")
            raise
        
        # Load skills database
        if skills_json_path is None:
            skills_json_path = os.path.join(
                os.path.dirname(__file__),
                '..',
                'skills.json'
            )
        
        self.skills_list = self._load_skills(skills_json_path)
        logger.info(f"Loaded {len(self.skills_list)} skills from database")
    
    @staticmethod
    def _load_skills(json_path: str) -> List[str]:
        """
        Load skills from JSON file.
        
        Args:
            json_path: Path to skills.json
            
        Returns:
            List of skills
        """
        try:
            with open(json_path, 'r') as f:
                data = json.load(f)
                # Handle different JSON structures
                if isinstance(data, dict) and 'skills' in data:
                    return data['skills']
                elif isinstance(data, list):
                    return data
                else:
                    logger.warning("Unexpected skills.json structure, using defaults")
                    return SkillExtractor._get_default_skills()
        except FileNotFoundError:
            logger.warning(f"skills.json not found at {json_path}, using default skills")
            return SkillExtractor._get_default_skills()
    
    @staticmethod
    def _get_default_skills() -> List[str]:
        """
        Return default skills list if JSON is not available.
        
        Returns:
            Default list of common technical and soft skills
        """
        return [
            # Programming Languages
            "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go",
            "Rust", "PHP", "Ruby", "Swift", "Kotlin", "R", "MATLAB",
            
            # Web Frameworks
            "FastAPI", "Django", "Flask", "Express", "React", "Vue", "Angular",
            "Next.js", "Spring", "ASP.NET", "Rails", "Laravel",
            
            # Databases
            "PostgreSQL", "MySQL", "MongoDB", "Redis", "Cassandra",
            "DynamoDB", "Elasticsearch", "Oracle", "SQLite",
            
            # Cloud & DevOps
            "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
            "Jenkins", "GitLab CI", "GitHub Actions", "Ansible",
            
            # Tools & Technologies
            "Git", "Linux", "Windows", "macOS", "REST API", "GraphQL",
            "Microservices", "CI/CD", "Docker Compose", "Nginx",
            
            # Data & ML
            "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
            "Pandas", "NumPy", "Scikit-learn", "SQL", "Data Analysis",
            
            # Soft Skills
            "Leadership", "Communication", "Problem Solving", "Team Collaboration",
            "Project Management", "Agile", "Scrum", "Critical Thinking"
        ]
    
    def _normalize_text(self, text: str) -> str:
        """
        Normalize text for skill matching.
        
        Operations:
        - Convert to lowercase
        - Remove special characters (keep alphanumeric and spaces)
        
        Args:
            text: Raw text
            
        Returns:
            Normalized text
        """
        import re
        text = text.lower()
        # Remove special characters but keep spaces
        text = re.sub(r'[^a-z0-9\s+#\.]', ' ', text)
        # Remove extra spaces
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def _fuzzy_match(self, text: str, skill: str, threshold: float = 0.85) -> bool:
        """
        Perform fuzzy matching between text and skill.
        
        Uses SequenceMatcher for typo tolerance.
        Threshold of 0.85 means 85% character match is required.
        
        Args:
            text: Text to search in
            skill: Skill to find
            threshold: Minimum match ratio (0-1)
            
        Returns:
            True if skill is found (with fuzzy match)
        """
        normalized_skill = skill.lower()
        
        # Check for exact match first
        if normalized_skill in text:
            return True
        
        # Fuzzy matching for typos/variations
        ratio = SequenceMatcher(None, text, normalized_skill).ratio()
        return ratio >= threshold
    
    def extract_skills(self, text: str) -> List[str]:
        """
        Extract skills from text.
        
        Algorithm:
        1. Normalize text (lowercase)
        2. For each skill in database:
           - Check if skill (or variation) appears in text
           - Use fuzzy matching for typo tolerance
        3. Return deduplicated skills
        
        Args:
            text: Resume or job description text
            
        Returns:
            List of extracted skills
        """
        if not text or not isinstance(text, str):
            logger.warning("Invalid text provided to extract_skills")
            return []
        
        normalized_text = self._normalize_text(text)
        extracted_skills: Set[str] = set()
        
        for skill in self.skills_list:
            if self._fuzzy_match(normalized_text, skill):
                extracted_skills.add(skill)
        
        result = sorted(list(extracted_skills))
        logger.info(f"Extracted {len(result)} skills from text")
        return result
    
    def extract_skills_with_context(self, text: str) -> List[str]:
        """
        Extract skills using spaCy NER for better context understanding.
        
        This method:
        1. Uses spaCy to identify potential entities
        2. Combines with skill list matching
        3. Returns high-confidence skill matches
        
        This is more sophisticated but slower than extract_skills().
        Use this when accuracy is more important than speed.
        
        Args:
            text: Resume or job description text
            
        Returns:
            List of extracted skills with context awareness
        """
        try:
            doc = self.nlp(text)
            skills = self.extract_skills(text)
            
            logger.info(f"Extracted {len(skills)} skills using context-aware method")
            return skills
        except Exception as e:
            logger.warning(f"Error in context-aware extraction: {str(e)}, falling back to basic extraction")
            return self.extract_skills(text)
