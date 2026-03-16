"""
Resume to Job Description matcher using sentence embeddings.

This module computes semantic similarity between resume and job description
using sentence-transformers (Sentence-BERT) model.

Why sentence-transformers?
- Pre-trained on semantic similarity tasks
- Fast inference compared to full transformer models
- Memory efficient (embedding-based, not requiring full text comparison)
- All-MiniLM-L6-v2 is specifically tuned for semantic search
- Model size: ~80MB, fits in memory easily

How it works:
1. Load pre-trained sentence-transformers model
2. Convert resume and job description to sentence embeddings (384-dim vectors)
3. Compute cosine similarity between embeddings
4. Scale to 0-100% match score

Cosine Similarity:
- Measures angle between two vectors in high-dimensional space
- Range: -1 to 1 (typically 0 to 1 for text)
- 1.0 = identical meaning, 0.0 = completely different
- Captures semantic meaning, not just keyword matching

Example:
- "Python developer" and "Software engineer with Python" → high similarity
- "Java" and "JavaScript" → moderate similarity
- "Frontend developer" and "Database administrator" → low similarity
"""

import logging
from typing import Tuple
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


class ResumeMatcher:
    """
    Match resume against job description using semantic similarity.
    
    Uses sentence-transformers to generate embeddings and compute
    cosine similarity between resume and job description.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the matcher with a sentence-transformers model.
        
        Args:
            model_name: HuggingFace model name (default: all-MiniLM-L6-v2)
                       This model is optimized for semantic search and inference speed.
                       
        Note:
            First initialization downloads the model (~80MB).
            Subsequent uses load from cache (~/.cache/huggingface).
        """
        try:
            self.model = SentenceTransformer(model_name)
            logger.info(f"Loaded sentence-transformers model: {model_name}")
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {str(e)}")
            raise
    
    @staticmethod
    def _preprocess_text(text: str, max_length: int = 512) -> str:
        """
        Preprocess text before embedding.
        
        Operations:
        - Remove extra whitespace
        - Limit length for efficiency (transformers have token limits)
        
        Args:
            text: Raw text
            max_length: Maximum length in characters
            
        Returns:
            Preprocessed text
        """
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        # Limit length (512 chars ≈ ~100 tokens)
        if len(text) > max_length:
            text = text[:max_length]
            logger.debug(f"Text truncated to {max_length} characters")
        
        return text
    
    def _compute_cosine_similarity(
        self,
        embedding1: np.ndarray,
        embedding2: np.ndarray
    ) -> float:
        """
        Compute cosine similarity between two embeddings.
        
        Formula: similarity = (A · B) / (||A|| * ||B||)
        
        Where:
        - A · B is dot product
        - ||A|| and ||B|| are L2 norms (lengths)
        
        Result range: -1 to 1
        - 1.0: identical (same direction)
        - 0.0: perpendicular (completely different)
        - -1.0: opposite (opposite directions)
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Similarity score (0-1)
        """
        # sklearn's cosine_similarity expects 2D arrays
        similarity = cosine_similarity(
            embedding1.reshape(1, -1),
            embedding2.reshape(1, -1)
        )[0][0]
        
        # Ensure value is in [0, 1] range
        return max(0.0, min(1.0, float(similarity)))
    
    def compute_match_score(
        self,
        resume_text: str,
        job_description_text: str
    ) -> Tuple[float, dict]:
        """
        Compute semantic match score between resume and job description.
        
        Algorithm:
        1. Preprocess both texts
        2. Generate embeddings using sentence-transformers
        3. Compute cosine similarity
        4. Scale to 0-100% percentage
        
        Args:
            resume_text: Extracted resume text
            job_description_text: Job description text
            
        Returns:
            Tuple of:
            - match_score: Float from 0 to 100 (percentage match)
            - metadata: Dict with detailed metrics
            
        Example:
            >>> matcher = ResumeMatcher()
            >>> score, metadata = matcher.compute_match_score(resume, jd)
            >>> print(f"Match: {score:.1f}%")
        """
        try:
            # Validate inputs
            if not resume_text or not job_description_text:
                logger.warning("Empty text provided to compute_match_score")
                return 0.0, {"error": "Empty input text"}
            
            # Preprocess texts
            resume_processed = self._preprocess_text(resume_text)
            jd_processed = self._preprocess_text(job_description_text)
            
            logger.info("Computing embeddings for resume and job description")
            
            # Generate embeddings (this is where the semantic understanding happens)
            resume_embedding = self.model.encode(resume_processed)
            jd_embedding = self.model.encode(jd_processed)
            
            # Compute similarity (0-1)
            similarity = self._compute_cosine_similarity(
                resume_embedding,
                jd_embedding
            )
            
            # Convert to percentage (0-100)
            match_score = similarity * 100
            
            metadata = {
                "similarity_score": similarity,
                "match_score_percent": match_score,
                "resume_length": len(resume_processed),
                "jd_length": len(jd_processed),
                "embedding_dimension": len(resume_embedding)
            }
            
            logger.info(f"Match score computed: {match_score:.2f}%")
            
            return match_score, metadata
            
        except Exception as e:
            logger.error(f"Error computing match score: {str(e)}")
            raise
    
    def batch_match(
        self,
        resume_text: str,
        job_descriptions: list
    ) -> list:
        """
        Compute match scores for multiple job descriptions against one resume.
        
        More efficient than calling compute_match_score multiple times
        because resume embedding is computed once.
        
        Args:
            resume_text: Extracted resume text
            job_descriptions: List of job description texts
            
        Returns:
            List of (match_score, jd_text) tuples, sorted by score (highest first)
        """
        try:
            resume_processed = self._preprocess_text(resume_text)
            resume_embedding = self.model.encode(resume_processed)
            
            results = []
            
            for jd in job_descriptions:
                jd_processed = self._preprocess_text(jd)
                jd_embedding = self.model.encode(jd_processed)
                
                similarity = self._compute_cosine_similarity(
                    resume_embedding,
                    jd_embedding
                )
                match_score = similarity * 100
                
                results.append((match_score, jd))
            
            # Sort by score (highest first)
            results.sort(key=lambda x: x[0], reverse=True)
            
            logger.info(f"Batch matched {len(results)} job descriptions")
            return results
            
        except Exception as e:
            logger.error(f"Error in batch matching: {str(e)}")
            raise
