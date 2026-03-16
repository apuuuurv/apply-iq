'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { createSkill, getSkillsByCategory } from './skills'
import { extractSkillsFromResumeText } from '@/lib/skills-extraction-utils'
import { revalidatePath } from 'next/cache'

/**
 * Sync resume skills to user's skill profile
 * Automatically creates or updates skills based on resume analysis
 */
export async function syncResumeSkillsToProfile(resumeText: string) {
  const supabase = await createServerActionClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  try {
    // Extract skills from resume
    const { technical, soft } = extractSkillsFromResumeText(resumeText)
    const allExtractedSkills = [...technical, ...soft]

    // Get existing skills
    const existingSkills = await getSkillsByCategory('matched')
    const existingSkillNames = existingSkills.map((s: any) => s.name.toLowerCase())

    // Add new skills that don't exist
    for (const skill of allExtractedSkills) {
      if (!existingSkillNames.includes(skill.toLowerCase())) {
        // Determine proficiency level based on skill type
        const proficiencyLevel = technical.includes(skill) ? 70 : 80

        await createSkill({
          name: skill,
          level: proficiencyLevel,
          category: 'matched',
        })
      }
    }

    revalidatePath('/dashboard/skills')
    return {
      success: true,
      skillsAdded: allExtractedSkills,
      technicalCount: technical.length,
      softCount: soft.length,
    }
  } catch (error) {
    console.error('Error syncing resume skills:', error)
    throw error
  }
}

/**
 * Calculate skill gap between resume and job description
 * Returns comprehensive analysis with strengths, weaknesses, and suggestions
 */
export async function calculateSkillGapFromResume(
  resumeText: string,
  jobDescription: string
) {
  const resumeSkills = extractSkillsFromResumeText(resumeText)
  const jobSkills = extractSkillsFromResumeText(jobDescription)

  // Find matches, missing, and suggestions
  const matched = resumeSkills.all.filter(skill =>
    jobSkills.all.includes(skill)
  )

  const missing = jobSkills.all.filter(skill =>
    !resumeSkills.all.includes(skill)
  )

  // Suggestions are similar to missing but with lower priority
  const suggestions = missing.slice(0, Math.ceil(missing.length * 0.5))

  // Calculate match percentage
  const matchPercentage = Math.round(
    (matched.length / (matched.length + missing.length)) * 100 || 0
  )

  // Determine strengths based on technical skills
  const strengths = matched.filter(skill =>
    resumeSkills.technical.includes(skill)
  )

  // Determine areas to improve based on missing technical skills
  const areasToImprove = missing.filter(skill =>
    jobSkills.technical.includes(skill)
  )

  return {
    matchedSkills: matched,
    missingSkills: missing,
    suggestedSkills: suggestions,
    strengths,
    areasToImprove,
    matchPercentage,
    analysis: {
      totalSkillsRequired: jobSkills.all.length,
      skillsYouHave: resumeSkills.all.length,
      technicalGap: jobSkills.technical.length - strengths.length,
      softGap: jobSkills.soft.length - matched.filter(s => jobSkills.soft.includes(s)).length,
      timestamp: new Date().toISOString(),
    },
  }
}

/**
 * Get user's resume skills (already extracted and stored)
 */
export async function getUserResumeSkills() {
  const supabase = await createServerActionClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { matched: [], missing: [], suggested: [] }
  }

  try {
    const [matched, missing, suggested] = await Promise.all([
      getSkillsByCategory('matched'),
      getSkillsByCategory('missing'),
      getSkillsByCategory('suggested'),
    ])

    return { matched, missing, suggested }
  } catch (error) {
    console.error('Error getting user resume skills:', error)
    return { matched: [], missing: [], suggested: [] }
  }
}
