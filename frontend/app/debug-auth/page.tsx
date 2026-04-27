'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function AuthDebugPage() {
  const [testEmail, setTestEmail] = useState('test@example.com')
  const [testPassword, setTestPassword] = useState('Test123456')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => {
    console.log(msg)
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  const testSignUp = async () => {
    setLoading(true)
    setLogs([])
    addLog('Starting sign up test...')

    try {
      const supabase = createClient()
      addLog('Supabase client created')

      // Check if user already exists by trying to sign in
      const { data: existingSession, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      if (!signInError) {
        addLog('✓ User already exists and can sign in!')
        const { data: { user } } = await supabase.auth.getUser()
        addLog(`User ID: ${user?.id}`)
        addLog(`User Email: ${user?.email}`)
        addLog(`Email Confirmed: ${user?.email_confirmed_at ? 'YES' : 'NO'}`)
        
        // Check profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .single()

        if (profileError) {
          addLog(`✗ Profile error: ${profileError.message}`)
        } else {
          addLog(`✓ Profile exists: ${JSON.stringify(profile)}`)
        }
        return
      }

      if (signInError?.status === 400) {
        addLog('User does not exist, attempting to sign up...')
      } else {
        addLog(`Sign in attempt error: ${signInError?.message}`)
      }

      // Try to sign up
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User',
          },
          emailRedirectTo: 'http://localhost:3000/auth/callback',
        },
      })

      if (signUpError) {
        addLog(`✗ Sign up error: ${signUpError.message}`)
        return
      }

      addLog(`✓ Sign up successful! User ID: ${authData.user?.id}`)
      addLog(`Email confirmed: ${authData.user?.email_confirmed_at ? 'YES' : 'NO (requires confirmation)'}`)
      addLog(`Session exists: ${authData.session ? 'YES' : 'NO'}`)

      // Try to create profile
      if (authData.user) {
        addLog('Attempting to create profile...')
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: testEmail,
              full_name: 'Test User',
            },
          ])

        if (profileError) {
          addLog(`✗ Profile creation error: ${profileError.message}`)
          addLog(`Error code: ${profileError.code}`)
          addLog(`Error details: ${JSON.stringify(profileError.details)}`)
        } else {
          addLog('✓ Profile created successfully!')
        }
      }

      // Check current session
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        addLog(`✗ Get user error: ${userError.message}`)
      } else {
        addLog(`✓ Current user: ${user?.email}`)
      }
    } catch (error: any) {
      addLog(`✗ Exception: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testSignIn = async () => {
    setLoading(true)
    setLogs([])
    addLog('Starting sign in test...')

    try {
      const supabase = createClient()
      addLog('Supabase client created')

      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      if (error) {
        addLog(`✗ Sign in error: ${error.message}`)
        addLog(`Error status: ${error.status}`)
        return
      }

      addLog('✓ Sign in successful!')
      addLog(`User: ${data.user?.email}`)
      addLog(`Session: ${data.session?.access_token ? 'YES' : 'NO'}`)

      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user?.id)
        .single()

      if (profileError) {
        addLog(`✗ Profile fetch error: ${profileError.message}`)
      } else {
        addLog(`✓ Profile found: ${JSON.stringify(profile)}`)
      }
    } catch (error: any) {
      addLog(`✗ Exception: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>

        <div className="bg-card rounded-lg border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Test Credentials</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="Test123456"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={testSignUp} disabled={loading} className="flex-1">
                {loading ? 'Testing...' : 'Test Sign Up'}
              </Button>
              <Button onClick={testSignIn} disabled={loading} variant="outline" className="flex-1">
                {loading ? 'Testing...' : 'Test Sign In'}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-slate-100 rounded-lg p-6 font-mono text-sm overflow-auto max-h-96">
          {logs.length === 0 ? (
            <p className="text-slate-500">Click a button to start debugging...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={
                log.includes('✓') ? 'text-green-400' :
                log.includes('✗') ? 'text-red-400' :
                'text-slate-300'
              }>
                {log}
              </div>
            ))
          )}
        </div>

        <div className="mt-8 pt-6 border-t">
          <a href="/" className="text-primary hover:underline">
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  )
}
