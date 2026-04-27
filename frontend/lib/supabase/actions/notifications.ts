'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Notification {
  id?: string
  title: string
  description?: string
  type: 'interview' | 'suggestion' | 'reminder' | 'update'
  is_read?: boolean
}

// Get all notifications for the current user
export async function getNotifications() {
  const supabase = await createServerActionClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('Error getting user:', userError)
    return []
  }
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return data || []
}

// Get unread notifications count
export async function getUnreadNotificationsCount() {
  const supabase = await createServerActionClient()
  
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  if (error) {
    console.error('Error fetching unread count:', error)
    return 0
  }

  return count || 0
}

// Create a new notification
export async function createNotification(notification: Notification) {
  const supabase = await createServerActionClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }
  
  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: user.id,
        title: notification.title,
        description: notification.description,
        type: notification.type,
        is_read: false,
      },
    ])
    .select()

  if (error) {
    console.error('Error creating notification:', error)
    throw error
  }

  revalidatePath('/dashboard/notifications')
  return data?.[0]
}

// Mark notification as read
export async function markNotificationAsRead(id: string) {
  const supabase = await createServerActionClient()
  
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }

  revalidatePath('/dashboard/notifications')
  return data?.[0]
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  const supabase = await createServerActionClient()
  
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    throw error
  }

  revalidatePath('/dashboard/notifications')
}

// Delete a notification
export async function deleteNotification(id: string) {
  const supabase = await createServerActionClient()
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting notification:', error)
    throw error
  }

  revalidatePath('/dashboard/notifications')
}
