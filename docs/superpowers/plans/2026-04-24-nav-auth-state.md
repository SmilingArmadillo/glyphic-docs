# Nav Auth State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show logged-in users their avatar + dropdown (Dashboard, Account, Billing, Help Center, Sign out) in the `DocsNav` header on all glyphic-docs pages, instead of the hardcoded Login link.

**Architecture:** Add `@supabase/supabase-js`, create a shared browser client in `lib/supabase.ts`, and extract the nav right-side into a new `NavUserMenu` component that reads `getSession()` on mount (localStorage, no network). `DocsNav` delegates its right side entirely to `NavUserMenu`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, `@supabase/supabase-js`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/supabase.ts` | Shared Supabase browser client |
| Create | `components/NavUserMenu.tsx` | Auth-aware right-side nav (avatar + dropdown or Login + CTA) |
| Modify | `components/DocsNav.tsx` | Replace hard-coded right side with `<NavUserMenu />` |

---

### Task 1: Install `@supabase/supabase-js`

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml` (auto-updated by pnpm)

- [ ] **Step 1: Install the package**

```bash
cd /Users/vishurajamani/vsc/glyphic-docs
pnpm add @supabase/supabase-js
```

Expected output: something like `+ @supabase/supabase-js 2.x.x` with no errors.

- [ ] **Step 2: Verify it appears in package.json**

```bash
grep supabase package.json
```

Expected: `"@supabase/supabase-js": "^2.x.x"` under `dependencies`.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @supabase/supabase-js (#109)"
```

---

### Task 2: Create `lib/supabase.ts`

**Files:**
- Create: `lib/supabase.ts`

- [ ] **Step 1: Create the file**

```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { flowType: 'pkce' } }
)
```

The `!` non-null assertions are safe here — if the env vars are missing the Supabase client will throw at runtime with a clear message, same as mermaid-studio's pattern.

- [ ] **Step 2: Run lint to confirm no errors**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase.ts
git commit -m "feat: add supabase browser client (#109)"
```

---

### Task 3: Create `components/NavUserMenu.tsx`

**Files:**
- Create: `components/NavUserMenu.tsx`

This component owns the entire right side of the nav. It uses the same `mounted` guard pattern already present in `DocsNav`'s `ThemeToggle` to avoid hydration mismatches.

- [ ] **Step 1: Create the file**

```tsx
// components/NavUserMenu.tsx
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
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-8 h-8 rounded-full bg-[#6366F1] text-white text-sm font-semibold flex items-center justify-center hover:opacity-85 transition-opacity"
      >
        {getInitial(user)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 min-w-[200px] bg-white dark:bg-[#1A1A1A] border border-[#E5E3DA] dark:border-[#2A2A2A] rounded-xl shadow-lg z-50 overflow-hidden"
        >
          <div className="px-3.5 py-2.5">
            <span className="block text-xs text-[#6B6B6B] dark:text-[#9CA3AF] truncate">
              {user.email}
            </span>
          </div>
          <div className="h-px bg-[#E5E3DA] dark:bg-[#2A2A2A] my-1" />
          <a role="menuitem" href={app('/dashboard')} className="block w-full px-3.5 py-2 text-sm text-[#1A1A1A] dark:text-[#F5F5F0] hover:bg-[#F5F4EE] dark:hover:bg-[#252525] transition-colors">
            Dashboard
          </a>
          <a role="menuitem" href={app('/dashboard/account')} className="block w-full px-3.5 py-2 text-sm text-[#1A1A1A] dark:text-[#F5F5F0] hover:bg-[#F5F4EE] dark:hover:bg-[#252525] transition-colors">
            Account
          </a>
          <a role="menuitem" href={app('/dashboard/billing')} className="block w-full px-3.5 py-2 text-sm text-[#1A1A1A] dark:text-[#F5F5F0] hover:bg-[#F5F4EE] dark:hover:bg-[#252525] transition-colors">
            Billing
          </a>
          <div className="h-px bg-[#E5E3DA] dark:bg-[#2A2A2A] my-1" />
          <a role="menuitem" href={app('/help')} className="block w-full px-3.5 py-2 text-sm text-[#1A1A1A] dark:text-[#F5F5F0] hover:bg-[#F5F4EE] dark:hover:bg-[#252525] transition-colors">
            Help Center
          </a>
          <div className="h-px bg-[#E5E3DA] dark:bg-[#2A2A2A] my-1" />
          <button
            role="menuitem"
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
```

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/NavUserMenu.tsx
git commit -m "feat: add NavUserMenu with auth-aware state (#109)"
```

---

### Task 4: Wire `NavUserMenu` into `DocsNav`

**Files:**
- Modify: `components/DocsNav.tsx`

- [ ] **Step 1: Update `DocsNav.tsx`**

Replace the right-side `<div>` contents. The full updated file:

```tsx
'use client'

import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'
import NavUserMenu from '@/components/NavUserMenu'

const isDev = process.env.NODE_ENV === 'development'
const app = (path: string) => isDev ? path : `https://glyphic.cc${path}`

const NAV_LINKS = [
  { label: 'Product', href: app('/#features'), prefix: null },
  { label: 'Docs', href: '/docs', prefix: '/docs' },
  { label: 'Examples', href: app('/examples'), prefix: null },
  { label: 'Use cases', href: app('/use-cases'), prefix: null },
  { label: 'Blog', href: app('/blog'), prefix: '/blog' },
  { label: 'Pricing', href: app('/pricing'), prefix: null },
]

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex items-center rounded-full border border-[#E5E3DA] dark:border-[#2A2A2A] p-1 overflow-hidden"
      suppressHydrationWarning
    >
      <Sun
        fill="currentColor"
        suppressHydrationWarning
        className={`size-4 p-0.5 rounded-full transition-colors ${!isDark ? 'bg-fd-accent text-fd-accent-foreground' : 'text-[#6B6B6B] dark:text-[#9CA3AF]'}`}
      />
      <Moon
        fill="currentColor"
        suppressHydrationWarning
        className={`size-4 p-0.5 rounded-full transition-colors ${isDark ? 'bg-fd-accent text-fd-accent-foreground' : 'text-[#6B6B6B] dark:text-[#9CA3AF]'}`}
      />
    </button>
  )
}

export default function DocsNav() {
  const pathname = usePathname()

  return (
    <header className="flex items-center justify-between px-6 h-14 bg-[#FAF9F4] dark:bg-[#0F0F0F] border-b border-[#E5E3DA] dark:border-[#2A2A2A]">
      <div className="flex items-center gap-6">
        <a href={app('/')} className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 90" width="186" height="30" aria-label="Glyphic" className="dark:hidden">
            <g transform="translate(-93.55 -63.46) scale(0.2308)">
              <path fill="none" stroke="#5B4FE9" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" d="M 440 340 L 640 340 L 720 420 L 720 520 L 640 600 L 540 600 L 540 520 L 620 520"/>
              <circle cx="440" cy="340" r="22" fill="#5B4FE9"/>
              <circle cx="640" cy="340" r="22" fill="#5B4FE9"/>
              <circle cx="720" cy="420" r="22" fill="#5B4FE9"/>
              <circle cx="720" cy="520" r="22" fill="#5B4FE9"/>
              <circle cx="640" cy="600" r="22" fill="#5B4FE9"/>
              <circle cx="540" cy="600" r="22" fill="#5B4FE9"/>
              <circle cx="540" cy="520" r="22" fill="#5B4FE9"/>
              <circle cx="620" cy="520" r="22" fill="#5B4FE9"/>
            </g>
            <text x="92" y="70" fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize="88">
              <tspan fill="#111111">glyphic</tspan><tspan fill="#5B4FE9">.cc</tspan>
            </text>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 90" width="186" height="30" aria-label="Glyphic" className="hidden dark:block">
            <g transform="translate(-93.55 -63.46) scale(0.2308)">
              <path fill="none" stroke="oklch(0.78 0.14 240)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" d="M 440 340 L 640 340 L 720 420 L 720 520 L 640 600 L 540 600 L 540 520 L 620 520"/>
              <circle cx="440" cy="340" r="22" fill="oklch(0.78 0.14 240)"/>
              <circle cx="640" cy="340" r="22" fill="oklch(0.78 0.14 240)"/>
              <circle cx="720" cy="420" r="22" fill="oklch(0.78 0.14 240)"/>
              <circle cx="720" cy="520" r="22" fill="oklch(0.78 0.14 240)"/>
              <circle cx="640" cy="600" r="22" fill="oklch(0.78 0.14 240)"/>
              <circle cx="540" cy="600" r="22" fill="oklch(0.78 0.14 240)"/>
              <circle cx="540" cy="520" r="22" fill="oklch(0.78 0.14 240)"/>
              <circle cx="620" cy="520" r="22" fill="oklch(0.78 0.14 240)"/>
            </g>
            <text x="92" y="70" fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize="88">
              <tspan fill="oklch(0.96 0.01 80)">glyphic</tspan><tspan fill="oklch(0.78 0.14 240)">.cc</tspan>
            </text>
          </svg>
        </a>
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = link.prefix ? pathname.startsWith(link.prefix) : false
            return (
              <a
                key={link.label}
                href={link.href}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[#1A1A1A] dark:text-[#F5F5F0]'
                    : 'text-[#6B6B6B] dark:text-[#9CA3AF] hover:text-[#1A1A1A] dark:hover:text-[#F5F5F0]'
                }`}
              >
                {link.label}
              </a>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NavUserMenu />
      </div>
    </header>
  )
}
```

Note: the logo SVG swap (`dark:hidden` / `hidden dark:block`) replaces the old `isDark` state+effect that drove it — Tailwind dark-mode classes handle this without JS, removing the mounted dependency from `DocsNav` itself.

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Start dev server and verify manually**

```bash
pnpm dev
```

Open `http://localhost:3000/docs` in a browser.

- Logged out: should see Login link + "Open editor →" button on the right.
- Logged in (session in localStorage from glyphic.cc): should see indigo avatar circle with your initial. Click it — dropdown should show email, Dashboard, Account, Billing, Help Center, Sign out.
- Press Escape or click outside — dropdown should close.

- [ ] **Step 4: Commit**

```bash
git add components/DocsNav.tsx
git commit -m "feat: wire NavUserMenu into DocsNav (#109)"
```
