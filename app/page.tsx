'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    init()
  }, [])

  const signIn = () => supabase.auth.signInWithOAuth({ 
    provider: 'google', 
    options: { redirectTo: `${window.location.origin}/auth/callback` } 
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Content Waterfall Studio</h1>
          <p className="text-zinc-500 mb-8">Test Page - Auth Working</p>
          <button onClick={signIn} className="px-4 py-3 bg-white text-black rounded-xl">
            Continue with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <h1 className="text-2xl font-bold">Content Waterfall Studio</h1>
      <p className="text-zinc-500">Logged in as: {user.email}</p>
      <button onClick={() => supabase.auth.signOut()} className="mt-4 px-4 py-2 bg-red-600 rounded">
        Sign Out
      </button>
    </div>
  )
}
