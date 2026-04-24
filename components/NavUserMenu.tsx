'use client'

import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const isDev = process.env.NODE_ENV === 'development'
const app = (path: string) => isDev ? path : `https://glyphic.cc${path}`

function getInitial(user: User): string {
  const name = user.user_metadata?.full_name as string | undefined
  if (name?.trim()) return name.trim()[0].toUpperCase()
  if (user.email) return user.email[0].toUpperCase()
  return 'A'
}

export default function NavUserMenu() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  async function handleSignOut() {
    setOpen(false)
    await supabase.auth.signOut()
    window.location.href = app('/')
  }

  // Server render + pre-mount: always show logged-out state to avoid hydration mismatch
  if (!mounted || !user) {
    return (
      <>
        <a
          href={app('/login')}
          className="text-sm font-medium text-[#6B6B6B] dark:text-[#9CA3AF] hover:text-[#1A1A1A] dark:hover:text-[#F5F5F0] transition-colors"
        >
          Login
        </a>
        <a
          href={app('/app')}
          className="px-4 py-2 text-sm font-medium text-white bg-[#6366F1] rounded-full transition-[transform,box-shadow] duration-150 ease-out hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
        >
          Open editor →
        </a>
      </>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="w-8 h-8 rounded-full bg-[#6366F1] text-white text-sm font-semibold flex items-center justify-center hover:opacity-85 transition-opacity"
      >
        {getInitial(user)}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-[200px] bg-white dark:bg-[#1A1A1A] border border-[#E5E3DA] dark:border-[#2A2A2A] rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-3.5 py-2.5">
            <span className="block text-xs text-[#6B6B6B] dark:text-[#9CA3AF] truncate">
              {user.email}
            </span>
          </div>
          <div className="h-px bg-[#E5E3DA] dark:bg-[#2A2A2A] my-1" />
          <a href={app('/dashboard')} className="block w-full px-3.5 py-2 text-sm text-[#1A1A1A] dark:text-[#F5F5F0] hover:bg-[#F5F4EE] dark:hover:bg-[#252525] transition-colors">
            Dashboard
          </a>
          <a href={app('/dashboard/account')} className="block w-full px-3.5 py-2 text-sm text-[#1A1A1A] dark:text-[#F5F5F0] hover:bg-[#F5F4EE] dark:hover:bg-[#252525] transition-colors">
            Account
          </a>
          <a href={app('/dashboard/billing')} className="block w-full px-3.5 py-2 text-sm text-[#1A1A1A] dark:text-[#F5F5F0] hover:bg-[#F5F4EE] dark:hover:bg-[#252525] transition-colors">
            Billing
          </a>
          <div className="h-px bg-[#E5E3DA] dark:bg-[#2A2A2A] my-1" />
          <a href={app('/help')} className="block w-full px-3.5 py-2 text-sm text-[#1A1A1A] dark:text-[#F5F5F0] hover:bg-[#F5F4EE] dark:hover:bg-[#252525] transition-colors">
            Help Center
          </a>
          <div className="h-px bg-[#E5E3DA] dark:bg-[#2A2A2A] my-1" />
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-[#F5F4EE] dark:hover:bg-[#252525] transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
