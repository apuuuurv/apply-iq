'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SkillGapAnalysis {
  id?: string
  jobDescription: string
  matchedSkills: string[]
  missingSkills: string[]
  suggestedSkills: string[]
  overallScore: number
  analysisResult?: Record<string, any>
}

// Perform skill gap analysis based on job description
export async function analyzeSkillGap(
  jobDescription: string,
  userSkills?: string[]
) {
  try {
    const supabase = await createServerActionClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get user's existing skills from database
    const { data: userSkillsData, error: skillsError } = await supabase
      .from('skills')
      .select('name, category, level')
      .eq('user_id', user.id)

    if (skillsError) {
      console.error('Error fetching user skills:', skillsError)
    }

    // Extract keywords from job description
    const jobKeywords = extractKeywordsFromText(jobDescription)
    
    // Get user skills list
    const userSkillsList = userSkillsData?.map(s => s.name.toLowerCase()) || userSkills || []
    
    // Categorize skills
    const matchedSkills = jobKeywords.filter(skill =>
      userSkillsList.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    )

    const missingSkills = jobKeywords.filter(skill =>
      !matchedSkills.includes(skill)
    )

    // Get suggested skills (top missing skills)
    const suggestedSkills = missingSkills.slice(0, 5)

    // Calculate overall score
    const overallScore = matchedSkills.length > 0 
      ? Math.round((matchedSkills.length / jobKeywords.length) * 100)
      : 0

    const analysisResult = {
      jobDescription,
      matchedSkills,
      missingSkills,
      suggestedSkills,
      overallScore,
      totalJobSkills: jobKeywords.length,
      userSkillsCount: userSkillsList.length,
      analysisDate: new Date().toISOString(),
    }

    // Save analysis to database
    const { data: analysisData, error: analysisError } = await supabase
      .from('skill_gap_analysis')
      .insert([
        {
          user_id: user.id,
          job_description: jobDescription,
          matched_skills: matchedSkills,
          missing_skills: missingSkills,
          suggested_skills: suggestedSkills,
          overall_score: overallScore,
          analysis_result: analysisResult,
        },
      ])
      .select()

    if (analysisError) {
      console.error('Error saving analysis:', analysisError)
      // Continue anyway, return the analysis even if save fails
    }

    revalidatePath('/dashboard/skills')
    
    return {
      ...analysisResult,
      saved: !analysisError,
    }
  } catch (error) {
    console.error('Error analyzing skill gap:', error)
    throw error
  }
}

// Extract common tech skills from text
function extractKeywordsFromText(text: string): string[] {
  const commonSkills = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", ".NET",
    "React", "Vue", "Angular", "Next.js", "Express",
    "Django", "Flask", "FastAPI", "Node.js",
    "SQL", "MongoDB", "PostgreSQL", "MySQL", "Firebase",
    "AWS", "GCP", "Azure", "Docker", "Kubernetes",
    "REST API", "GraphQL", "WebSocket",
    "Git", "Agile", "Scrum", "Jira",
    "HTML", "CSS", "Tailwind", "Bootstrap",
    "Jest", "Mocha", "Cypress", "Selenium",
    "System Design", "Microservices", "CI/CD",
    "Spring Boot", "Hibernate", "JPA",
    "Redis", "Elasticsearch", "Kafka",
    "Linux", "Bash", "PowerShell",
    "Machine Learning", "TensorFlow", "PyTorch",
    "Data Analysis", "Pandas", "NumPy",
  ]

  const foundSkills = commonSkills.filter(skill =>
    text.toLowerCase().includes(skill.toLowerCase())
  )

  return [...new Set(foundSkills)] // Remove duplicates
}

// Get skill analysis history
export async function getSkillAnalysisHistory() {
  const supabase = await createServerActionClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return []
  }

  const { data, error } = await supabase
    .from('skill_gap_analysis')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching analysis history:', error)
    return []
  }

  return data || []
}

// Get latest skill analysis
export async function getLatestSkillAnalysis() {
  const supabase = await createServerActionClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return null
  }

  const { data, error } = await supabase
    .from('skill_gap_analysis')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching latest analysis:', error)
    return null
  }

  return data
}

// Record skill gap analysis from external results (e.g. Resume Analyzer)
export async function recordSkillGapAnalysis(analysis: {
  jobDescription: string
  matchedSkills: string[]
  missingSkills: any[]
  overallScore: number
  analysisResult?: any
}) {
  try {
    const supabase = await createServerActionClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    const missingSkillsList = analysis.missingSkills.map(s => typeof s === 'string' ? s : s.skill)

    const { data, error } = await supabase
      .from('skill_gap_analysis')
      .insert([
        {
          user_id: user.id,
          job_description: analysis.jobDescription,
          matched_skills: analysis.matchedSkills,
          missing_skills: missingSkillsList,
          suggested_skills: missingSkillsList.slice(0, 5),
          overall_score: analysis.overallScore,
          analysis_result: analysis.analysisResult || analysis,
        },
      ])
      .select()

    if (error) {
      console.error('Error recording skill gap analysis:', error)
      throw error
    }

    revalidatePath('/dashboard/skills')
    return data?.[0]
  } catch (error) {
    console.error('Error in recordSkillGapAnalysis:', error)
    throw error
  }
}

// Delete skill analysis
export async function deleteSkillAnalysis(id: string) {
  const supabase = await createServerActionClient()
  
  const { error } = await supabase
    .from('skill_gap_analysis')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting analysis:', error)
    throw error
  }

  revalidatePath('/dashboard/skills')
}
