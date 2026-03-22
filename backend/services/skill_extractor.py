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
from typing import List, Set, Optional
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
    
    def __init__(self, skills_json_path: Optional[str] = None):
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
    
    def extract_potential_skills(self, text: str) -> Set[str]:
        """
        Extract potential skills from text using regex and heuristics.
        
        This looks for:
        - Common tech patterns (Node.js, C++, C#, .NET)
        - PascalCase/camelCase words that might be frameworks
        - Uppercase acronyms (AWS, GCP, SQL)
        - Intersection with the global skills list
        
        Args:
            text: Raw text to extract from
            
        Returns:
            Set of potential skill strings
        """
        import re
        
        # 1. Start with matches from the global list (reliable)
        found_skills = set()
        normalized_text = self._normalize_text(text)
        
        for skill in self.skills_list:
            if self._fuzzy_match(normalized_text, skill):
                found_skills.add(skill)
        
        # 2. Add regex-based tech patterns (less reliable, but catches new terms)
        # Patterns like Node.js, React.js, C++, C#, .NET, Web3, Vue3
        tech_patterns = [
            r'\b[A-Z][a-z]+(?:\.[a-z]+|[A-Z][a-z]+)+\b', # PascalCase/camelCase
            r'\b[A-Za-z]+\.js\b',                        # *.js
            r'\b[A-Z]{2,}\b',                            # Acronyms (AWS, GCP)
            r'\b[A-Za-z]+\+\+\b',                        # C++
            r'\b[A-Za-z]+#\b',                           # C#
            r'\.\b[A-Za-z]+\b',                          # .NET
        ]
        
        for pattern in tech_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                # Basic validation: length and not common words
                if len(match) > 1 and match.lower() not in ['the', 'and', 'for', 'with', 'from']:
                    found_skills.add(match)
        
        return found_skills

    def classify_skill(self, skill: str) -> str:
        """
        Classify a skill as 'tech' or 'secondary'.
        
        Args:
            skill: Skill name
            
        Returns:
            'tech' or 'secondary'
        """
        soft_skill_keywords = [
            'communication', 'leadership', 'problem solving', 'team', 
            'management', 'agile', 'scrum', 'critical thinking', 
            'adaptability', 'creativity', 'time management', 'collaboration'
        ]
        
        skill_lower = skill.lower()
        for keyword in soft_skill_keywords:
            if keyword in skill_lower:
                return 'secondary'
                
        return 'tech'

    def extract_skills(self, text: str) -> List[str]:
        """
        Extract skills from text.
        """
        if not text:
            return []
            
        potential_skills = self.extract_potential_skills(text)
        return sorted(list(potential_skills))

    def extract_skills_with_context(self, text: str) -> List[str]:
        """
        Fallback to basic extraction for now.
        """
        return self.extract_skills(text)
