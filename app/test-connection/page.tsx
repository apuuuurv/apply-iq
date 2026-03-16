'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestConnectionPage() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'failed'>('loading')
  const [details, setDetails] = useState<string>('')

  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabase = createClient()
        
        // Test 1: Check if client initialized
        if (!supabase) {
          setStatus('failed')
          setDetails('Supabase client not initialized')
          return
        }

        // Test 2: Try to get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setStatus('failed')
          setDetails(`Auth error: ${sessionError.message}`)
          return
        }

        // Test 3: Try a simple query
        const { data, error } = await supabase
          .from('profiles')
          .select('count', { count: 'exact' })
          .limit(1)

        if (error) {
          setStatus('failed')
          setDetails(`Query error: ${error.message}`)
          return
        }

        setStatus('connected')
        setDetails(`✓ Successfully connected to Supabase!`)
      } catch (error: any) {
        setStatus('failed')
        setDetails(`Exception: ${error.message}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
        
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${
              status === 'connected' ? 'bg-green-500' :
              status === 'failed' ? 'bg-red-500' :
              'bg-yellow-500 animate-pulse'
            }`} />
            <span className="font-semibold text-lg">
              {status === 'connected' ? '✓ Connected' :
               status === 'failed' ? '✗ Failed' :
               '⏳ Testing...'}
            </span>
          </div>
        </div>

        <div className="bg-slate-100 rounded p-4 mb-6 font-mono text-sm">
          {details || 'Running connection tests...'}
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <p><strong>Supabase URL:</strong></p>
          <p className="font-mono text-xs break-all bg-slate-50 p-2 rounded">
            {process.env.NEXT_PUBLIC_SUPABASE_URL}
          </p>
        </div>

        <div className="mt-6 pt-6 border-t">
          <a href="/" className="text-primary hover:underline">
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  )
}
