'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { BrainCircuit, Loader2, Lock, Mail, ShieldCheck, User } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestLogin = () => {
    // Purely client-side: set localStorage + a cookie for the middleware/server
    localStorage.setItem('isGuest', 'true')
    document.cookie = 'guest_mode=true; path=/'
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f1c] font-sans text-slate-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#1f2937] bg-[#111827] shadow-2xl">
        <div className="flex flex-col items-center border-b border-[#1f2937] bg-[#0a0f1c] px-8 py-10 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <BrainCircuit className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-white">XRAIX SYSTEM</h1>
          <p className="mt-2 text-sm text-slate-400 uppercase tracking-widest">Authorized Personnel Only</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full rounded-lg border border-[#1f2937] bg-[#0a0f1c] p-3 pl-10 text-slate-200 placeholder-slate-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="doctor@hospital.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full rounded-lg border border-[#1f2937] bg-[#0a0f1c] p-3 pl-10 text-slate-200 placeholder-slate-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-500 disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
              {isLoading ? 'Authenticating...' : 'Secure Login'}
            </button>
            
            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#1f2937]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#111827] px-2 text-slate-500">Or continue as visitor</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#1f2937] bg-[#0a0f1c] px-4 py-3 font-semibold text-slate-300 transition-all hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400 disabled:opacity-50 cursor-pointer"
            >
              <User className="h-5 w-5" />
              Login as Guest
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
