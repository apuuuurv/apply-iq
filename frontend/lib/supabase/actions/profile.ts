'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Profile {
  id?: string
  email?: string
  fullName?: string
  avatarUrl?: string
  resumeText?: string
}

// Get user profile
export async function getProfile() {
  const supabase = await createServerActionClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('Error getting user:', userError)
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

// Update user profile
export async function updateProfile(profile: Profile) {
  const supabase = await createServerActionClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }
  
  if (profile.email) updateData.email = profile.email
  if (profile.fullName) updateData.full_name = profile.fullName
  if (profile.avatarUrl) updateData.avatar_url = profile.avatarUrl
  if (profile.resumeText) updateData.resume_text = profile.resumeText

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    throw error
  }

  revalidatePath('/dashboard/settings')
  return data
}

// Get or create profile for new user
export async function getOrCreateProfile() {
  const supabase = await createServerActionClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('Error getting user:', userError)
    return null
  }

  let profile = await getProfile()
  
  if (!profile) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          email: user.email,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      return null
    }

    profile = data
  }

  return profile
}
