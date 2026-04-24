# Design Spec: Cookie-Based Auth for Server-Side Nav State (#11)

**Date:** 2026-04-24
**Issue:** #11
**Status:** Proposed

## Goal

Eliminate the Login→avatar flash in `NavUserMenu` by reading the Supabase session server-side (via cookie) and passing the `user` prop down to a presentational `NavUserMenu`, so the correct nav state renders on the first byte.

## Background

`NavUserMenu` is currently a `'use client'` component that reads from localStorage on mount. This means:
1. Server renders the "Login" state (no localStorage on server)
2. React hydrates and reads localStorage → shows avatar
3. Users see a Login→avatar flash (~150–300ms) on every page load

mermaid-studio#110 (now merged) switched the Supabase client to `@supabase/ssr`'s `createBrowserClient`, which writes the session as a cookie with `path=/`. This cookie is now available to the Next.js server on every request to glyphic-docs.

## Approach

### 1. Add `@supabase/ssr` to glyphic-docs

Install `@supabase/ssr`. Create a **server-side Supabase client** factory in `lib/supabase-server.ts` using `createServerClient` from `@supabase/ssr`, wired to Next.js `cookies()`.

### 2. Add Next.js middleware to refresh session cookies

Create `middleware.ts` at the project root. The middleware uses `createServerClient` to refresh the Supabase session cookie on every request, ensuring the token doesn't expire mid-session without the user noticing.

The middleware should match all paths except Next.js internals and static assets:
```ts
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 3. Make `app/layout.tsx` a Server Component that reads the session

`app/layout.tsx` is already a Server Component (no `'use client'`). Add a call to the server-side Supabase client to get the current `user`, then pass it as a prop to `DocsNav`.

### 4. Thread `user` through `DocsNav` → `NavUserMenu`

- `DocsNav` currently renders `<NavUserMenu />` with no props. Make it accept and forward a `user: User | null` prop.
- `NavUserMenu` becomes a split component:
  - **`NavUserMenu`** (Server Component or plain function, no `'use client'`) — receives `user` prop, renders the correct initial state.
  - Interactive parts (dropdown open/close, sign-out button) still need client interactivity. Extract a **`NavUserMenuClient`** (`'use client'`) that handles the dropdown toggle and sign-out action. It receives `user` as a prop and renders nothing until mounted — but since the server already rendered the correct initial state, there's no flash.

### Architecture: avoiding hydration mismatch

The key constraint: the server renders a definite state (logged-in or logged-out), and the client must hydrate to the same state. The approach:

- Server reads cookie → gets `user` → passes to `NavUserMenu`
- `NavUserMenu` renders the avatar or Login links based on `user`
- `NavUserMenuClient` (the interactive wrapper) receives the same `user` prop as its initial state — no `mounted` guard needed, because the server and client agree on the initial value

This eliminates both the flash and any hydration mismatch.

### What stays in `NavUserMenu` client-side

The dropdown (open/close), outside-click handler, keyboard handler, and sign-out button still need browser APIs. These live in `NavUserMenuClient`. The static login/avatar display is server-rendered.

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Add `@supabase/ssr` dependency |
| `lib/supabase-server.ts` | New: server-side Supabase client factory (using `createServerClient` + Next.js `cookies()`) |
| `middleware.ts` | New: session refresh middleware |
| `app/layout.tsx` | Read `user` from server Supabase client; pass to `DocsNav` |
| `components/DocsNav.tsx` | Accept `user: User | null` prop; forward to `NavUserMenu` |
| `components/NavUserMenu.tsx` | Split into server shell + `NavUserMenuClient` (`'use client'`); receive `user` prop |

`lib/supabase.ts` (the existing browser singleton) remains unchanged — it's still used by `NavUserMenuClient` for sign-out.

## Acceptance Criteria

- Visiting `/docs` or `/blog` while logged in shows the avatar on first paint, no flash
- No hydration mismatch warnings
- Session is refreshed correctly on expiry via middleware
- Sign-out still works and redirects correctly
- `pnpm lint` passes

## What is NOT changing

- `lib/supabase.ts` — browser singleton stays, used only for sign-out
- Any doc content, MDX, or Fumadocs configuration
- Blog or docs page components
