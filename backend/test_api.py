#!/usr/bin/env python
"""
Resume Analyzer API - Example Usage & Testing Script

This script demonstrates how to use the Resume Analyzer API.
Run this script to test the API end-to-end.

Requirements:
- API must be running (python main.py)
- requests library: pip install requests
- Sample resume PDF or DOCX file

Usage:
    python test_api.py --file resume.pdf --jd "job_description.txt"
"""

import requests
import json
import sys
from pathlib import Path
from typing import Dict, Optional
import argparse


# ============================================================================
# CONFIGURATION
# ============================================================================

API_BASE_URL = "http://localhost:8000"
HEALTH_CHECK_URL = f"{API_BASE_URL}/health"
ANALYZE_URL = f"{API_BASE_URL}/analyze"

# Sample job descriptions for testing
SAMPLE_JOB_DESCRIPTIONS = {
    "python_fastapi": """
    We are seeking a talented Python developer to join our team.
    
    Requirements:
    - 3+ years of Python experience
    - Strong experience with FastAPI or Django
    - PostgreSQL and MongoDB knowledge
    - Docker and Kubernetes experience
    - Experience with microservices architecture
    
    Nice to have:
    - Machine Learning experience
    - AWS or GCP cloud experience
    - Redis experience
    """,
    
    "full_stack": """
    Full Stack Developer - React + Node.js
    
    Must have:
    - 2+ years React experience
    - Node.js and Express knowledge
    - JavaScript/TypeScript
    - MongoDB or PostgreSQL
    - Git version control
    
    Preferred:
    - Docker experience
    - REST API design
    - Testing (Jest, Cypress)
    - Agile methodology
    """,
    
    "ml_engineer": """
    Machine Learning Engineer
    
    Requirements:
    - Python proficiency
    - TensorFlow or PyTorch experience
    - Scikit-learn and Pandas
    - SQL and data analysis
    - Machine Learning fundamentals
    - Deep Learning experience
    
    Bonus:
    - NLP experience
    - Computer Vision
    - AWS or GCP ML services
    - Production ML deployment
    """
}


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def check_api_health() -> bool:
    """
    Check if API is running and healthy.
    
    Returns:
        True if API is healthy, False otherwise
    """
    try:
        response = requests.get(HEALTH_CHECK_URL, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✓ API is healthy")
            print(f"  - Resume Parser: {data['services']['resume_parser']}")
            print(f"  - Skill Extractor: {data['services']['skill_extractor']}")
            print(f"  - Resume Matcher: {data['services']['resume_matcher']}")
            return True
        else:
            print(f"✗ API returned status {response.status_code}")
            return False
    except requests.ConnectionError:
        print("✗ Cannot connect to API. Is it running? (python main.py)")
        return False
    except Exception as e:
        print(f"✗ Error checking API health: {str(e)}")
        return False


def analyze_resume(
    file_path: str,
    job_description: str,
    verbose: bool = True
) -> Optional[Dict]:
    """
    Send resume and job description to API for analysis.
    
    Args:
        file_path: Path to resume file (PDF or DOCX)
        job_description: Job description text
        verbose: Print detailed output
        
    Returns:
        Analysis result dict or None if error
    """
    try:
        # Validate file exists
        if not Path(file_path).exists():
            print(f"✗ File not found: {file_path}")
            return None
        
        # Get file extension
        file_ext = Path(file_path).suffix.lower()
        if file_ext not in ['.pdf', '.docx', '.doc']:
            print(f"✗ Unsupported file type: {file_ext}")
            print("   Supported: .pdf, .docx, .doc")
            return None
        
        # Validate job description
        if not job_description or len(job_description) < 50:
            print("✗ Job description is too short (min 50 characters)")
            return None
        
        # Prepare request
        with open(file_path, 'rb') as f:
            files = {'file': f}
            data = {'job_description': job_description}
            
            if verbose:
                print(f"\n📄 Analyzing resume: {Path(file_path).name}")
                print(f"📝 Job description: {len(job_description)} characters")
                print("\n🔄 Processing...")
            
            # Send request
            response = requests.post(
                ANALYZE_URL,
                files=files,
                data=data,
                timeout=30
            )
        
        # Handle response
        if response.status_code == 200:
            result = response.json()
            
            if verbose:
                print_analysis_result(result)
            
            return result
        
        else:
            error = response.json() if response.text else {}
            print(f"✗ API Error ({response.status_code}):")
            print(f"  {error.get('detail', 'Unknown error')}")
            return None
    
    except requests.Timeout:
        print("✗ Request timeout (API took too long to respond)")
        return None
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return None


def print_analysis_result(result: Dict) -> None:
    """
    Pretty print analysis result.
    
    Args:
        result: Analysis result dict from API
    """
    match_score = result.get('match_score', 0)
    resume_skills = result.get('resume_skills', [])
    jd_skills = result.get('jd_skills', [])
    missing_skills = result.get('missing_skills', [])
    
    # Determine color based on score
    if match_score >= 80:
        score_emoji = "🟢"
    elif match_score >= 60:
        score_emoji = "🟡"
    else:
        score_emoji = "🔴"
    
    print("\n" + "="*60)
    print("📊 ANALYSIS RESULTS")
    print("="*60)
    
    # Match score
    print(f"\n{score_emoji} Match Score: {match_score:.1f}%")
    print("   " + "█" * int(match_score / 5) + "░" * (20 - int(match_score / 5)))
    
    # Resume skills
    print(f"\n✓ Resume Skills ({len(resume_skills)})")
    if resume_skills:
        for skill in resume_skills[:10]:  # Show first 10
            print(f"  • {skill}")
        if len(resume_skills) > 10:
            print(f"  ... and {len(resume_skills) - 10} more")
    else:
        print("  (None detected)")
    
    # JD skills
    print(f"\n📋 Job Description Skills ({len(jd_skills)})")
    if jd_skills:
        for skill in jd_skills[:10]:  # Show first 10
            print(f"  • {skill}")
        if len(jd_skills) > 10:
            print(f"  ... and {len(jd_skills) - 10} more")
    else:
        print("  (None detected)")
    
    # Missing skills
    print(f"\n⚠️  Missing Skills ({len(missing_skills)})")
    if missing_skills:
        for skill in missing_skills:
            print(f"  • {skill}")
    else:
        print("  (All required skills present!)")
    
    print("\n" + "="*60)


def interactive_test() -> None:
    """
    Interactive testing mode where user can:
    - Select sample job description
    - Or paste custom job description
    - Provide resume file path
    """
    print("\n" + "="*60)
    print("Resume Analyzer API - Interactive Test")
    print("="*60)
    
    # Check API health
    print("\n🔍 Checking API health...")
    if not check_api_health():
        print("\n⚠️  Cannot proceed without healthy API.")
        return
    
    # Get resume file
    print("\n" + "-"*60)
    resume_path = input("📄 Enter path to resume file: ").strip()
    
    if not resume_path:
        print("✗ No file provided")
        return
    
    # Get job description
    print("\n" + "-"*60)
    print("📋 Job Description Options:")
    print("  1. Python + FastAPI Developer")
    print("  2. Full Stack Developer (React + Node.js)")
    print("  3. Machine Learning Engineer")
    print("  4. Enter custom job description")
    
    choice = input("\nSelect option (1-4): ").strip()
    
    job_description = ""
    
    if choice == "1":
        job_description = SAMPLE_JOB_DESCRIPTIONS["python_fastapi"]
    elif choice == "2":
        job_description = SAMPLE_JOB_DESCRIPTIONS["full_stack"]
    elif choice == "3":
        job_description = SAMPLE_JOB_DESCRIPTIONS["ml_engineer"]
    elif choice == "4":
        job_description = input("\nPaste job description (end with blank line):\n")
    else:
        print("✗ Invalid choice")
        return
    
    if not job_description:
        print("✗ No job description provided")
        return
    
    # Analyze
    print("\n" + "-"*60)
    analyze_resume(resume_path, job_description, verbose=True)


def batch_test(resume_dir: str) -> None:
    """
    Test multiple resumes in a directory.
    
    Args:
        resume_dir: Directory containing resume files
    """
    resume_path = Path(resume_dir)
    
    if not resume_path.is_dir():
        print(f"✗ Directory not found: {resume_dir}")
        return
    
    resumes = list(resume_path.glob("*.pdf")) + list(resume_path.glob("*.docx"))
    
    if not resumes:
        print(f"✗ No resume files found in {resume_dir}")
        return
    
    print(f"\n📂 Found {len(resumes)} resume(s)")
    
    # Use first sample job description
    jd = SAMPLE_JOB_DESCRIPTIONS["python_fastapi"]
    
    results = []
    for resume in resumes:
        print(f"\n🔄 Processing: {resume.name}")
        result = analyze_resume(str(resume), jd, verbose=True)
        if result:
            results.append({
                'file': resume.name,
                'score': result['match_score'],
                'missing_skills': result['missing_skills']
            })
    
    # Summary
    if results:
        print("\n" + "="*60)
        print("📊 BATCH TEST SUMMARY")
        print("="*60)
        
        results.sort(key=lambda x: x['score'], reverse=True)
        
        for i, result in enumerate(results, 1):
            print(f"\n{i}. {result['file']}: {result['score']:.1f}%")
            if result['missing_skills']:
                print(f"   Missing: {', '.join(result['missing_skills'][:3])}")


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Test Resume Analyzer API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python test_api.py                          # Interactive mode
  python test_api.py --file resume.pdf        # Use default JD
  python test_api.py --batch ./resumes/       # Test multiple files
        """
    )
    
    parser.add_argument(
        '--file',
        help='Path to resume file (PDF or DOCX)'
    )
    parser.add_argument(
        '--jd',
        help='Path to job description text file (or provide text)'
    )
    parser.add_argument(
        '--batch',
        help='Directory containing multiple resume files'
    )
    parser.add_argument(
        '--job-type',
        choices=['python', 'fullstack', 'ml'],
        default='python',
        help='Sample job description type'
    )
    
    args = parser.parse_args()
    
    # Batch mode
    if args.batch:
        batch_test(args.batch)
        return
    
    # File mode
    if args.file:
        # Load job description
        if args.jd:
            try:
                with open(args.jd, 'r') as f:
                    jd = f.read()
            except FileNotFoundError:
                jd = args.jd  # Treat as raw text
        else:
            # Use sample based on job_type
            if args.job_type == 'python':
                jd = SAMPLE_JOB_DESCRIPTIONS['python_fastapi']
            elif args.job_type == 'fullstack':
                jd = SAMPLE_JOB_DESCRIPTIONS['full_stack']
            elif args.job_type == 'ml':
                jd = SAMPLE_JOB_DESCRIPTIONS['ml_engineer']
            else:
                jd = SAMPLE_JOB_DESCRIPTIONS['python_fastapi']
        
        # Check API health
        if not check_api_health():
            return
        
        # Analyze
        analyze_resume(args.file, jd, verbose=True)
        
        return
    
    # Interactive mode (default)
    interactive_test()


if __name__ == "__main__":
    main()
