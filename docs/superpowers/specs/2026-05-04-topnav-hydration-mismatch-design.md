# Design: Fix TopNav CSS Modules Hydration Mismatch (#18)

## Problem

`MarketingLayoutClient` initializes `atTop` state using a `typeof window !== 'undefined'` guard:

```ts
const [atTop, setAtTop] = useState(() =>
  isLanding && (typeof window !== 'undefined' ? window.scrollY === 0 : true)
)
```

On the server, `window` is undefined so `atTop` defaults to `true` → nav renders with `nav--top` class.
On the client, the lazy initializer runs synchronously before hydration and reads `window.scrollY` — which produces a different CSS Modules hash (`nav--top__TE2c4` vs `nav__8ywHA`) causing React's hydration warning.

## Behaviour Contract

| Context | `atTop` | Nav style |
|---|---|---|
| Server (all pages) | `true` | `nav--top` (full-width fixed header) |
| Client — non-landing page | `false` (set by `useEffect`) | `nav--top` (fixed header, non-landing always) |
| Client — landing page, scroll y = 0 | `true` | `nav--top` |
| Client — landing page, scroll y > 0 | `false` | floating pill |

Transitions between `nav--top` and pill are animated via the existing CSS `transition` on `.nav`.

## Fix

**File:** `app/(marketing)/MarketingLayoutClient.tsx`, line 18

```ts
// Before
const [atTop, setAtTop] = useState(() =>
  isLanding && (typeof window !== 'undefined' ? window.scrollY === 0 : true)
)

// After
const [atTop, setAtTop] = useState(true)
```

`true` is the correct SSR assumption for all pages. The existing `useEffect` (which runs after hydration) already calls `setAtTop(window.scrollY === 0)` to correct client state. On mid-scroll page loads the nav briefly shows full-width then transitions — imperceptible due to the CSS transition.

## Scope

- **In scope:** The one-line `useState` initializer change.
- **Out of scope:** TopNav.tsx, TopNav.module.css, MarketingLayout.module.css — no changes needed.

## Acceptance Criteria

- [ ] No React hydration warning for TopNav `className` in the browser console.
- [ ] Landing page: nav starts full-width, transitions to pill on scroll down, back to full-width on scroll to top.
- [ ] Non-landing pages: nav is always full-width fixed header.
- [ ] CSS transition animates the switch (no hard cut).
