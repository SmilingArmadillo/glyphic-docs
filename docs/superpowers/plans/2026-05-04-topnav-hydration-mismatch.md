# TopNav Hydration Mismatch Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the React hydration warning caused by `MarketingLayoutClient` reading `window.scrollY` synchronously in the `useState` initializer, which produces a different CSS class name on the client than the server emitted.

**Architecture:** Replace the lazy `useState` initializer (which guesses scroll position at hydration time) with a simple `useState(true)` — matching the server's assumption that the nav starts full-width. The existing `useEffect` already corrects to actual scroll position after mount, so no other changes are needed.

**Tech Stack:** Next.js 14 App Router, React, CSS Modules, TypeScript

---

### Task 1: Fix the `useState` initializer in `MarketingLayoutClient.tsx`

**Files:**
- Modify: `app/(marketing)/MarketingLayoutClient.tsx` (line 18)

- [ ] **Step 1: Open the file and locate the broken initializer**

Open [`app/(marketing)/MarketingLayoutClient.tsx`](app/(marketing)/MarketingLayoutClient.tsx). Find line 18:

```ts
const [atTop, setAtTop] = useState(() => isLanding && (typeof window !== 'undefined' ? window.scrollY === 0 : true))
```

- [ ] **Step 2: Replace with the safe initializer**

Replace that line with:

```ts
const [atTop, setAtTop] = useState(true)
```

The full updated component should look like this:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import TopNav from '@/components/marketing/TopNav'
import Footer from '@/components/marketing/Footer'
import styles from '@/components/marketing/MarketingLayout.module.css'

interface Props {
  user: User | null
  children: React.ReactNode
}

export default function MarketingLayoutClient({ user, children }: Props) {
  const pathname = usePathname()
  const isLanding = pathname === '/'
  const [atTop, setAtTop] = useState(true)

  useEffect(() => {
    if (!isLanding) {
      setAtTop(false)
      return
    }
    setAtTop(window.scrollY === 0)
    const onScroll = () => setAtTop(window.scrollY === 0)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isLanding])

  const navWrapClass = [
    styles['nav-wrap'],
    !isLanding ? styles['nav-wrap--static'] : atTop ? styles['nav-wrap--top'] : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.layout} data-marketing>
      <div className={navWrapClass}>
        <TopNav user={user} atTop={!isLanding || atTop} />
      </div>
      <main className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 3: Run the linter to confirm no errors**

```bash
pnpm lint
```

Expected: no errors or warnings related to this file.

- [ ] **Step 4: Run the dev server and verify manually**

```bash
pnpm dev
```

Open `http://localhost:3000` in a browser with DevTools console open.

**Check 1 — No hydration warning:**
Reload the page. The console should show no `Warning: Prop className did not match` error.

**Check 2 — Landing page scroll behaviour:**
- At page load (scroll y = 0): nav is full-width fixed header (no pill shape).
- Scroll down past the top: nav animates to floating pill.
- Scroll back to top: nav animates back to full-width.

**Check 3 — Non-landing page:**
Navigate to `/docs` or `/blog`. Nav should always be full-width fixed header, never pill.

**Check 4 — Mid-scroll load (landing page):**
Scroll down, then hard-reload. Nav briefly shows full-width then transitions to pill — the CSS transition should make this imperceptible.

- [ ] **Step 5: Commit**

```bash
git add app/(marketing)/MarketingLayoutClient.tsx
git commit -m "fix: resolve TopNav className hydration mismatch (#18)"
```
