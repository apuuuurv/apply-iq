'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Skill {
  id?: string
  name: string
  level: number
  category: 'matched' | 'missing' | 'suggested'
}

// Get all skills for the current user
export async function getSkills() {
  const supabase = await createServerActionClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('Error getting user:', userError)
    return []
  }
  
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching skills:', error)
    return []
  }

  return data || []
}

// Get skills by category
export async function getSkillsByCategory(category: 'matched' | 'missing' | 'suggested') {
  const supabase = await createServerActionClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('Error getting user:', userError)
    return []
  }
  
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('user_id', user.id)
    .eq('category', category)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching skills:', error)
    return []
  }

  return data || []
}

// Create a new skill
export async function createSkill(skill: Skill) {
  const supabase = await createServerActionClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }
  
  const { data, error } = await supabase
    .from('skills')
    .insert([
      {
        user_id: user.id,
        name: skill.name,
        level: skill.level,
        category: skill.category,
      },
    ])
    .select()

  if (error) {
    console.error('Error creating skill:', error)
    throw error
  }

  revalidatePath('/dashboard/skills')
  return data?.[0]
}

// Update a skill
export async function updateSkill(id: string, skill: Partial<Skill>) {
  const supabase = await createServerActionClient()
  
  const updateData: Record<string, any> = {}
  if (skill.name) updateData.name = skill.name
  if (skill.level) updateData.level = skill.level
  if (skill.category) updateData.category = skill.category
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('skills')
    .update(updateData)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating skill:', error)
    throw error
  }

  revalidatePath('/dashboard/skills')
  return data?.[0]
}

// Delete a skill
export async function deleteSkill(id: string) {
  const supabase = await createServerActionClient()
  
  const { error } = await supabase
    .from('skills')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting skill:', error)
    throw error
  }

  revalidatePath('/dashboard/skills')
}
