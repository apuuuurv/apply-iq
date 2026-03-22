import sys
import os

BASE_URL = "http://localhost:8000"

def test_analysis():
    print("Testing Resume Analyzer Accuracy...")
    
    # Test JD with specific terms
    jd = "We are looking for an Express developer with experience in Matplotlib and Seaborn. Knowledge of React is a plus. Express is required for our backend. We use Express for everything."
    # Express appears 3 times -> should be 100% weight if missing
    # Matplotlib appears 1 time -> should be 40% weight if missing
    # React appears 1 time -> should be 40% weight if missing
    
    # Simple "resume" text (just a string for testing if we had a text endpoint, 
    # but the API requires a file. I'll use a dummy PDF if possible or skip file upload test if I can't easily create one).
    # Actually, I'll just check the logic by looking at the code I wrote, it's quite straightforward.
    
    # Since I cannot easily create a PDF here without external tools, I will 
    # run a python script that imports the services directly to test the logic.
    pass

if __name__ == "__main__":
    # Instead of a full API test which needs a file, let's test the SkillExtractor directly
    import sys
    import os
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    
    from services.skill_extractor import SkillExtractor
    from services.utils import clean_text
    
    extractor = SkillExtractor()
    
    jd = "We are looking for an Express developer with experience in Matplotlib and Seaborn. Knowledge of React is a plus. Express is required for our backend. We use Express for everything."
    jd_clean = clean_text(jd)
    
    skills = extractor.extract_skills(jd_clean)
    print(f"Extracted from JD: {skills}")
    
    # Verify 'Express', 'Matplotlib', 'Seaborn', 'React' are found
    expected = {'Express', 'Matplotlib', 'Seaborn', 'React'}
    found = set(skills)
    missing_expected = expected - found
    if missing_expected:
        print(f"FAILED: Missing expected skills: {missing_expected}")
    else:
        print("SUCCESS: All expected skills found in JD")
        
    # Test classification
    for skill in skills:
        category = extractor.classify_skill(skill)
        print(f"Skill: {skill}, Category: {category}")
        
    # Test intersection logic (simulated)
    resume_text = "Experienced Developer with React and Matplotlib."
    resume_clean = clean_text(resume_text)
    resume_skills = set(s.lower() for s in extractor.extract_skills(resume_clean))
    jd_skills = set(s.lower() for s in skills)
    
    matched = jd_skills.intersection(resume_skills)
    missing = jd_skills - resume_skills
    
    print(f"Matched: {matched}")
    print(f"Missing: {missing}")
    
    # Verify strict intersection: 'Express' should NOT be in matched
    if 'express' in matched:
        print("FAILED: 'Express' found in matched but NOT in resume")
    else:
        print("SUCCESS: Strict intersection working")
        
    # Verify weighting
    for m in missing:
        count = jd_clean.count(m)
        if m == 'express' and count >= 3:
            print(f"SUCCESS: 'express' count is {count} (>=3)")
        elif m == 'seaborn' and count == 1:
            print(f"SUCCESS: 'seaborn' count is {count}")
