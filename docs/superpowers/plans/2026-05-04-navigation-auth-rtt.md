# Eliminate Navigation Auth RTT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `supabase.auth.getUser()` with `supabase.auth.getSession()` in all three layout files to eliminate a per-navigation Supabase Auth network round-trip.

**Architecture:** Each of the three Next.js App Router layouts currently calls `getUser()` which validates the JWT against the Supabase Auth server on every server render. Replacing with `getSession()` reads the session from the signed HttpOnly cookie already present in the request — zero network cost. Downstream components receive `session?.user ?? null`, which has the same `User | null` type so no child changes are needed.

**Tech Stack:** Next.js 14 App Router, `@supabase/ssr` (`createServerClient`), TypeScript

---

### Task 1: Update `app/docs/layout.tsx`

**Files:**
- Modify: `app/docs/layout.tsx`

- [ ] **Step 1: Open the file and locate the auth call**

The relevant lines (15–16) currently read:
```ts
const supabase = createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()
```

- [ ] **Step 2: Replace with `getSession()` and update the variable passed to `DocsNav`**

Change lines 15–16 and the `DocsNav` usage so the file reads:

```tsx
import { DocsLayout } from 'fumadocs-ui/layout'
import type { ReactNode } from 'react'
import { source } from '@/lib/source'
import { baseOptions } from '@/app/layout.config'
import DocsFooter from '@/components/DocsFooter'
import DocsNav from '@/components/DocsNav'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { perfStart } from '@/lib/perf-log'

export default async function Layout({ children }: { children: ReactNode }) {
  const end = perfStart('docs/layout')
  const treeSize = JSON.stringify(source.pageTree).length
  end()
  console.log(`[docs/layout] pageTree size: ${treeSize} bytes`)
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  return (
    <>
      <DocsNav user={session?.user ?? null} />
      <DocsLayout tree={source.pageTree} {...baseOptions}>
        {children}
      </DocsLayout>
      <DocsFooter />
    </>
  )
}
```

- [ ] **Step 3: Verify TypeScript — run lint**

```bash
pnpm lint
```

Expected: no errors on `app/docs/layout.tsx`.

- [ ] **Step 4: Commit**

```bash
git add app/docs/layout.tsx
git commit -m "fix: use getSession() in docs layout to eliminate auth RTT (#15)"
```

---

### Task 2: Update `app/(marketing)/layout.tsx`

**Files:**
- Modify: `app/(marketing)/layout.tsx`

- [ ] **Step 1: Open the file and locate the auth call**

The relevant lines (5–6) currently read:
```ts
const supabase = createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()
```

- [ ] **Step 2: Replace with `getSession()` and update the variable passed to `MarketingLayoutClient`**

The full file should read:

```tsx
import { createSupabaseServerClient } from '@/lib/supabase-server'
import MarketingLayoutClient from './MarketingLayoutClient'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  return <MarketingLayoutClient user={session?.user ?? null}>{children}</MarketingLayoutClient>
}
```

- [ ] **Step 3: Verify TypeScript — run lint**

```bash
pnpm lint
```

Expected: no errors on `app/(marketing)/layout.tsx`.

- [ ] **Step 4: Commit**

```bash
git add app/(marketing)/layout.tsx
git commit -m "fix: use getSession() in marketing layout to eliminate auth RTT (#15)"
```

---

### Task 3: Update `app/blog/layout.tsx`

**Files:**
- Modify: `app/blog/layout.tsx`

- [ ] **Step 1: Open the file and locate the auth call**

The relevant lines (5–6) currently read:
```ts
const supabase = createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()
```

- [ ] **Step 2: Replace with `getSession()` and update the variable passed to `DocsNav`**

The full file should read:

```tsx
import DocsNav from '@/components/DocsNav'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  return (
    <>
      <DocsNav user={session?.user ?? null} />
      {children}
    </>
  )
}
```

- [ ] **Step 3: Verify TypeScript — run lint**

```bash
pnpm lint
```

Expected: no errors on `app/blog/layout.tsx`.

- [ ] **Step 4: Commit**

```bash
git add app/blog/layout.tsx
git commit -m "fix: use getSession() in blog layout to eliminate auth RTT (#15)"
```

---

### Task 4: Final verification

- [ ] **Step 1: Run full lint pass**

```bash
pnpm lint
```

Expected: exits 0, no errors.

- [ ] **Step 2: Start dev server and verify nav renders correctly**

```bash
pnpm dev
```

Open `http://localhost:3000/docs` in a browser. Open DevTools → Network tab → filter by `supabase` or `auth/v1`. Navigate between several docs pages.

Expected: **no requests** to `*.supabase.co/auth/v1/user` appear during navigation. The nav bar should show "Login / Open editor →" when logged out, and the user avatar when logged in.

- [ ] **Step 3: Verify build succeeds**

```bash
pnpm build
```

Expected: exits 0.
