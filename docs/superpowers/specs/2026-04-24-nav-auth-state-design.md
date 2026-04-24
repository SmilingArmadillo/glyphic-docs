---
title: Nav auth state on Docs/Blog pages
date: 2026-04-24
issue: SmilingArmadillo/mermaid-studio#109
---

# Design: Nav auth state on Docs/Blog pages

## Problem

`DocsNav` (used on every page of the glyphic-docs Next.js site, including `/docs` and `/blog`) always renders the Login link and "Open editor →" CTA regardless of whether the user is logged in. The marketing site (`glyphic.cc`) already shows the correct logged-in state via `AuthContext` + `useUser()`, but that React context is not available in this Next.js app.

## Goal

When a user visits `/docs` or `/blog` while logged in to glyphic.cc, the nav right-side should show their avatar and a dropdown menu (Dashboard, Account, Billing, Help Center, Sign out). When logged out, it should show the current Login + "Open editor →" buttons.

## Constraints

- `/docs` and `/blog` are not protected pages — no privileged actions happen here. Reading from localStorage via `getSession()` is sufficient; `getUser()` (server round-trip) is not needed and must not be used for this UI.
- No hydration flash is acceptable. The server renders a neutral state; the client upgrades after mount.
- Styling stays within the existing Tailwind utility class conventions of `DocsNav`.
- No new complex state management — a single `useState` + `useEffect` in a focused component is the right scope.

## Architecture

### 1. `lib/supabase.ts` (new file)

A single shared Supabase browser client for the Next.js app:

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { flowType: 'pkce' } }
)
```

Same config as `mermaid-studio/src/utils/supabase.ts`. Uses `NEXT_PUBLIC_*` env vars so values are inlined at build time and available client-side.

### 2. `components/NavUserMenu.tsx` (new file)

A focused `'use client'` component that owns the entire right-side of the nav:

**State:**
- `mounted: boolean` — false on server/first render, set to true in `useEffect`
- `user: User | null` — null until `getSession()` resolves
- `open: boolean` — controls dropdown visibility

**Render logic:**
- `!mounted` → render Login + "Open editor →" (matches server render, no flash)
- `mounted && !user` → same Login + "Open editor →"
- `mounted && user` → avatar button (32×32 circle, `bg-[#6366F1]` indigo, white initial) + dropdown

**`useEffect` on mount:**
1. Call `supabase.auth.getSession()` — reads localStorage, no network call
2. Set `user` from `session?.user ?? null`
3. Subscribe to `supabase.auth.onAuthStateChange` to keep state current for sign-in/sign-out events that happen after load
4. Return cleanup to unsubscribe

**Dropdown items** (when open, positioned `absolute right-0 top-full mt-2`):
- User email (display only)
- Divider
- Dashboard → `app('/dashboard')`
- Account → `app('/dashboard/account')`
- Billing → `app('/dashboard/billing')`
- Divider
- Help Center → `app('/help')`
- Divider
- Sign out → calls `supabase.auth.signOut()` then `window.location.href = app('/')`

All nav items use `<a href>` (not `useNavigate`) since cross-origin navigation to `glyphic.cc` is needed in production.

**Click-outside / Escape close:** `useEffect` registers `mousedown` and `keydown` listeners when `open === true`, same pattern as `UserMenu` in mermaid-studio.

### 3. `components/DocsNav.tsx` (modified)

Remove the hard-coded Login link and "Open editor →" anchor from the right-side `<div>`. Replace with `<NavUserMenu />`. The `ThemeToggle` component is unchanged.

## No-flash guarantee

`NavUserMenu` renders the Login state both on the server (no `window`) and on the initial client render before the `useEffect` fires. `getSession()` reads from `localStorage` synchronously-ish (it's technically async but resolves in the same microtask queue tick with no network). The visual swap to the avatar happens in the same frame as the `ThemeToggle` hydration swap — consistent with existing behaviour.

If the user has no session, there is no swap at all.

## Environment variables

Two `NEXT_PUBLIC_*` env vars must be added to the glyphic-docs deployment environment:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Same as `VITE_SUPABASE_URL` in mermaid-studio |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as `VITE_SUPABASE_ANON_KEY` in mermaid-studio |

These are safe to expose client-side (anon key is row-level-security scoped).

## New dependency

`@supabase/supabase-js` must be added to `package.json` in glyphic-docs. Same package already used in mermaid-studio.

## Out of scope

- Changes to mermaid-studio
- Server-side auth (`@supabase/ssr`, middleware, cookies)
- Any new protected routes in glyphic-docs
- Changes to the `UserMenu` component in mermaid-studio

## Acceptance criteria

- [ ] Visiting `/docs` while logged in shows the avatar button; no Login link visible
- [ ] Visiting `/blog` while logged in shows the avatar button; no Login link visible
- [ ] Visiting either page while logged out shows Login + "Open editor →"
- [ ] Avatar dropdown shows email, Dashboard, Account, Billing, Help Center, Sign out
- [ ] Sign out clears the session and redirects to glyphic.cc home
- [ ] No hydration mismatch warning in the browser console
- [ ] No flash of wrong state on page load
