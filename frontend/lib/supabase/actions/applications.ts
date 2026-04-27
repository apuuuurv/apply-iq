'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface JobApplication {
  id?: string
  company: string
  role: string
  applied_date?: string
  status: 'applied' | 'interview' | 'offer' | 'rejected'
  location?: string
  salary?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

// Get all job applications for the current user
export async function getJobApplications() {
  const supabase = await createServerActionClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('Error getting user:', userError)
    return []
  }
  
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('applied_date', { ascending: false })

  if (error) {
    console.error('Error fetching applications:', error)
    return []
  }

  return data || []
}

// Get a single job application by ID
export async function getJobApplication(id: string) {
  const supabase = await createServerActionClient()
  
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching application:', error)
    return null
  }

  return data
}

// Create a new job application
export async function createJobApplication(application: JobApplication) {
  const supabase = await createServerActionClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }
  
  const { data, error } = await supabase
    .from('job_applications')
    .insert([
      {
        user_id: user.id,
        company: application.company,
        role: application.role,
        applied_date: application.applied_date || new Date().toISOString().split('T')[0],
        status: application.status,
        location: application.location || null,
        salary: application.salary || null,
        notes: application.notes || null,
      },
    ])
    .select()

  if (error) {
    console.error('Error creating application:', error)
    throw error
  }

  revalidatePath('/dashboard/applications')
  return data?.[0]
}

// Update a job application
export async function updateJobApplication(id: string, application: Partial<JobApplication>) {
  const supabase = await createServerActionClient()
  
  const updateData: Record<string, any> = {}
  if (application.company) updateData.company = application.company
  if (application.role) updateData.role = application.role
  if (application.status) updateData.status = application.status
  if (application.location !== undefined) updateData.location = application.location
  if (application.salary !== undefined) updateData.salary = application.salary
  if (application.notes !== undefined) updateData.notes = application.notes
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('job_applications')
    .update(updateData)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating application:', error)
    throw error
  }

  revalidatePath('/dashboard/applications')
  return data?.[0]
}

// Delete a job application
export async function deleteJobApplication(id: string) {
  const supabase = await createServerActionClient()
  
  const { error } = await supabase
    .from('job_applications')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting application:', error)
    throw error
  }

  revalidatePath('/dashboard/applications')
}
