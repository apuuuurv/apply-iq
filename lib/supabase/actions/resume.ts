'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Resume {
  id?: string
  fileName?: string
  file_name?: string
  fileUrl?: string
  file_url?: string
  extractedSkills?: string[]
  extracted_skills?: string[]
  analysisResult?: Record<string, any>
  analysis_result?: Record<string, any>
  matchScore?: number
  match_score?: number
  created_at?: string
  updated_at?: string
}

// Get all resumes for the current user
export async function getResumes() {
  const supabase = await createServerActionClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('Error getting user:', userError)
    return []
  }

  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching resumes:', error)
    return []
  }

  return data || []
}

// Create a new resume entry
export async function createResume(resume: Resume) {
  const supabase = await createServerActionClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('resumes')
    .insert([
      {
        user_id: user.id,
        file_name: resume.fileName,
        file_url: resume.fileUrl,
        extracted_skills: resume.extractedSkills || [],
        analysis_result: resume.analysisResult || {},
      },
    ])
    .select()

  if (error) {
    console.error('Error creating resume:', error)
    throw error
  }

  revalidatePath('/dashboard/resume')
  return data?.[0]
}

// Update a resume
export async function updateResume(id: string, resume: Partial<Resume>) {
  const supabase = await createServerActionClient()
  
  const updateData: Record<string, any> = {}
  if (resume.fileName) updateData.file_name = resume.fileName
  if (resume.fileUrl) updateData.file_url = resume.fileUrl
  if (resume.extractedSkills) updateData.extracted_skills = resume.extractedSkills
  if (resume.analysisResult) updateData.analysis_result = resume.analysisResult
  if (resume.matchScore !== undefined) updateData.match_score = resume.matchScore
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('resumes')
    .update(updateData)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating resume:', error)
    throw error
  }

  revalidatePath('/dashboard/resume')
  return data?.[0]
}

// Delete a resume
export async function deleteResume(id: string) {
  const supabase = await createServerActionClient()
  
  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting resume:', error)
    throw error
  }

  revalidatePath('/dashboard/resume')
}

// Store resume text analysis
export async function analyzeResumeText(
  resumeText: string,
  jobDescription: string,
  extractedSkills: string[]
) {
  const supabase = await createServerActionClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Here you would call an AI service to analyze
  // For now, we'll just store the analysis result
  const analysisResult = {
    resumeText,
    jobDescription,
    extractedSkills,
    matchPercentage: calculateMatchScore(extractedSkills, jobDescription),
    analyzedAt: new Date().toISOString(),
  }

  return analysisResult
}

// Simple match score calculation
function calculateMatchScore(extractedSkills: string[], jobDescription: string): number {
  if (!extractedSkills.length) return 0
  
  const matchCount = extractedSkills.filter(skill =>
    jobDescription.toLowerCase().includes(skill.toLowerCase())
  ).length
  
  return Math.round((matchCount / extractedSkills.length) * 100)
}
