'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function registerUser(
  email: string,
  password: string,
  fullName: string
) {
  try {
    const supabase = await createServerActionClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return { error: 'An account with this email already exists' }
    }

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (authError) {
      console.error('Sign up error:', authError)
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: 'User creation failed' }
    }

    try {
      // Create profile for new user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email,
            full_name: fullName,
          },
        ])

      if (profileError) {
        console.error('Error creating profile:', profileError)
        // Don't fail here - the user account is created
        // Profile can be created later or will be auto-created by trigger
      }
    } catch (profileErr) {
      console.error('Profile insertion exception:', profileErr)
      // Continue - user is created even if profile fails
    }

    return {
      success: true,
      user: authData.user,
      requiresEmailConfirmation: !authData.session, // If no session, email confirmation is needed
    }
  } catch (error) {
    console.error('Registration error:', error)
    return { error: 'An error occurred during registration' }
  }
}

export async function signInWithGoogle() {
  try {
    const supabase = await createServerActionClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) {
      return { error: error.message }
    }

    if (data?.url) {
      redirect(data.url)
    }

    return { error: 'Failed to initialize Google sign-in' }
  } catch (error: any) {
    console.error('Google sign-in error:', error)
    return { error: error.message || 'An error occurred during Google sign-in' }
  }
}

export async function signInWithGitHub() {
  try {
    const supabase = await createServerActionClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) {
      return { error: error.message }
    }

    if (data?.url) {
      redirect(data.url)
    }

    return { error: 'Failed to initialize GitHub sign-in' }
  } catch (error: any) {
    console.error('GitHub sign-in error:', error)
    return { error: error.message || 'An error occurred during GitHub sign-in' }
  }
}
