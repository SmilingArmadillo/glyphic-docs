# Implementation Plan: Cookie-Based Auth for Server-Side Nav State (#11)

**Date:** 2026-04-24
**Issue:** #11
**Spec:** `docs/superpowers/specs/2026-04-24-cookie-auth-nav-design.md`

## Overview

6-file change. Install `@supabase/ssr`, create a server Supabase client + middleware, update `app/layout.tsx` to read user server-side, thread `user` through `DocsNav` → `NavUserMenu`, split `NavUserMenu` into a server shell + `NavUserMenuClient`.

All work is in `/Users/vishurajamani/vsc/glyphic-docs/.worktrees/issue-11-cookie-auth-nav`.

## Task 1: Install `@supabase/ssr`

```bash
pnpm add @supabase/ssr
```

Verify `package.json` shows `@supabase/ssr` in dependencies.

Commit: `chore: add @supabase/ssr dependency (#11)`

## Task 2: Create `lib/supabase-server.ts`

New file. Server-side Supabase client factory using `createServerClient` from `@supabase/ssr` and Next.js `cookies()` from `next/headers`.

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookies can only be set from middleware
          }
        },
      },
    }
  )
}
```

Commit: `feat: add server-side Supabase client factory (#11)`

## Task 3: Create `middleware.ts`

New file at the project root. Refreshes the Supabase session cookie on every request.

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do not remove this
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

Commit: `feat: add Next.js middleware for Supabase session refresh (#11)`

## Task 4: Update `app/layout.tsx` to read user server-side

In `app/layout.tsx`, call `createSupabaseServerClient()`, get `user` from `getUser()`, and pass it as a prop to `DocsNav`.

```ts
import { createSupabaseServerClient } from '@/lib/supabase-server'
// ...
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  // ...
  return (
    // ...
    <DocsNav user={user} />
    // ...
  )
}
```

Commit: `feat: read Supabase user server-side in RootLayout (#11)`

## Task 5: Update `components/DocsNav.tsx` and split `NavUserMenu`

### 5a. `DocsNav.tsx`

- Remove `'use client'` directive (it only uses `usePathname` for active link — keep that, but `DocsNav` can remain a client component since it already has `'use client'` for `usePathname`)
- Add `user: User | null` prop and forward it to `NavUserMenu`

Wait — `DocsNav` uses `usePathname()` so it must remain `'use client'`. But `app/layout.tsx` is a Server Component. Server Components can pass serializable props (like `User`) to Client Components — this is fine.

### 5b. `NavUserMenu.tsx` → split into two

**`NavUserMenu.tsx`** — becomes a thin wrapper that just forwards the `user` prop to `NavUserMenuClient`.

**`NavUserMenuClient.tsx`** — `'use client'`. Contains all the interactive logic (dropdown, sign-out, outside-click). Receives `user: User | null` as a prop (initial state from server). Does NOT read from localStorage on mount — the server-provided value is the initial state. Still subscribes to `onAuthStateChange` for subsequent sign-in/sign-out events.

The `mounted` guard (`if (!mounted)`) is removed from the login/avatar display — since server and client agree on the initial `user` value, there's no hydration mismatch.

Commit: `feat: split NavUserMenu into server shell + NavUserMenuClient (#11)`

## Task 6: Lint check

```bash
pnpm lint
```

Fix any TypeScript or ESLint issues. Commit fixes if needed.

## Verification (manual, post-deploy)

1. Sign in on glyphic.cc — navigate to `/docs`
2. Hard-reload `/docs` — avatar should appear on first paint, no Login→avatar flash
3. Sign out — nav correctly shows Login
4. Token refresh: session should stay valid across extended sessions
