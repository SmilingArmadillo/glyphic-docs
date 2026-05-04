# Design: Eliminate Navigation Auth RTT (#15)

## Problem

Every docs, blog, and marketing page navigation incurs a round-trip to the Supabase Auth server. All three layouts call `supabase.auth.getUser()`, which validates the JWT remotely on every server render. This blocks the render and causes a perceptible delay on every page transition.

## Root Cause

`getUser()` makes an outbound HTTP request to the Supabase Auth server to validate the session token. `getSession()` reads the session from the signed HttpOnly cookie — zero network cost, available synchronously on the server.

## Decision: getSession() over localStorage

A localStorage-based check was considered. It was rejected because:

- Server components cannot access localStorage — the server would render the logged-out nav state, then the client would correct it after hydration, causing a visible flash on every hard navigation.
- `getSession()` provides the same zero-RTT benefit but is available server-side, eliminating the flash.

Security tradeoff: `getSession()` trusts the signed cookie without re-validating the JWT against Supabase on every request. This is acceptable because the docs site has no sensitive APIs or protected data — the nav bar's only role is cosmetic (login/logout button). Real auth enforcement happens in the Glyphic app, not here. `NavUserMenuClient` already subscribes to `onAuthStateChange` client-side, so live sign-in/sign-out state stays reactive regardless.

## Scope

**In scope:**
- Replace `supabase.auth.getUser()` with `supabase.auth.getSession()` in three layout files:
  - `app/docs/layout.tsx`
  - `app/(marketing)/layout.tsx`
  - `app/blog/layout.tsx`
- Pass `session?.user ?? null` in place of `user` to downstream components.

**Out of scope:** Middleware-based auth, full auth refactor, any changes to child components (`DocsNav`, `TopNav`, `MarketingLayoutClient`, `NavUserMenu`, `NavUserMenuClient`).

## Change Details

### Before (each layout)
```ts
const { data: { user } } = await supabase.auth.getUser()
// pass user to child
```

### After (each layout)
```ts
const { data: { session } } = await supabase.auth.getSession()
// pass session?.user ?? null to child
```

The downstream prop type remains `User | null` — no child component changes required.

## Acceptance Criteria

- [ ] No Supabase Auth network call fires on page navigation (verifiable via browser DevTools Network tab — no requests to `supabase.co/auth/v1/user`)
- [ ] Logged-in/logged-out state renders correctly in the nav bar on first paint
- [ ] No TypeScript errors (`pnpm lint` passes)
