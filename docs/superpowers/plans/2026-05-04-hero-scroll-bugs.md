# Hero Mouseover + Scroll Restoration Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two independent landing page bugs: the hero ripple effect losing mouse responsiveness, and the page scrolling to mid-page on hard reload.

**Architecture:** Both fixes are surgical — no new files, no new abstractions. Bug #19 is fixed entirely inside `RippleField.tsx` by refreshing the stage bounding rect on each mouse move and moving the animation frame handle to a ref. Bug #20 is fixed by injecting a `beforeInteractive` script in `app/layout.tsx` to set `history.scrollRestoration = 'manual'` before hydration, and scrolling to top on LandingPage mount.

**Tech Stack:** React 18, Next.js 14 App Router, TypeScript

---

## Files

| File | Change |
|------|--------|
| `components/marketing/RippleField.tsx` | Refresh `stageRect` on every `mousemove`; move `raf` to `useRef` so closures always see the live value |
| `app/layout.tsx` | Add `<script strategy="beforeInteractive">` to set `history.scrollRestoration = 'manual'` |
| `components/marketing/LandingPage.tsx` | Add `useEffect` to call `window.scrollTo(0, 0)` on mount |

---

## Task 1: Fix stale `stageRect` in RippleField (issue #19, part 1)

**Files:**
- Modify: `components/marketing/RippleField.tsx`

**Problem:** `stageRect` is set once at mount (`stageRect = stage.getBoundingClientRect()`) and only refreshed on resize. If the page layout shifts after mount (Google Fonts loading, nav settling), the stored rect becomes stale. Mouse coordinates then map to the wrong relative position, so the ripple effect appears dead near the cursor.

- [ ] **Step 1: Read the current onMove handler**

Open `components/marketing/RippleField.tsx`. Locate the `onMove` function (around line 119):

```ts
function onMove(e: MouseEvent) {
  mouseRef.current.x = e.clientX - stageRect.left
  mouseRef.current.y = e.clientY - stageRect.top
  mouseRef.current.active = true
}
```

- [ ] **Step 2: Replace onMove to recompute stageRect inline**

Change `onMove` to call `getBoundingClientRect()` on every mouse event instead of using the stored `stageRect`. The browser caches this per frame so it is not expensive:

```ts
function onMove(e: MouseEvent) {
  const r = stage!.getBoundingClientRect()
  mouseRef.current.x = e.clientX - r.left
  mouseRef.current.y = e.clientY - r.top
  mouseRef.current.active = true
}
```

The `stageRect` local variable is still used in `buildFloaters` for the ResizeObserver path — leave that assignment in place. Only `onMove` changes.

- [ ] **Step 3: Verify the build passes**

```bash
cd /Users/vishurajamani/vsc/glyphic-docs && pnpm build
```

Expected: build completes with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add components/marketing/RippleField.tsx
git commit -m "fix: recompute stageRect on each mousemove in RippleField (#19)"
```

---

## Task 2: Fix stale `raf` closure in applyReducedMotion (issue #19, part 2)

**Files:**
- Modify: `components/marketing/RippleField.tsx`

**Problem:** The `applyReducedMotion` function captures `raf` by value from the outer `useEffect` closure at the time it is defined. After the animation loop restarts (e.g. from a resize rebuild), `raf` holds a new `requestAnimationFrame` id, but the `applyReducedMotion` closure still references the old stale value. If `prefers-reduced-motion` fires, it cancels the stale id (a no-op) and leaves the loop running, or cancels the real loop and then the `!raf` guard sees 0 and never restarts correctly.

- [ ] **Step 1: Add a rafRef alongside the existing mouseRef**

At the top of the `useEffect` body, locate where `let raf = 0` is declared (around line 133). Replace it with a ref. Because we're inside `useEffect`, we can't call `useRef` here — instead, use a plain object ref already available in scope. Add a `rafRef` to the component's ref declarations at the top of the component function body:

In the component body (before `useEffect`), change:

```ts
const mouseRef = useRef({ x: -1000, y: -1000, active: false })
```

to:

```ts
const mouseRef = useRef({ x: -1000, y: -1000, active: false })
const rafRef = useRef(0)
```

- [ ] **Step 2: Replace all uses of `raf` with `rafRef.current` inside useEffect**

Inside the `useEffect`, replace every read/write of `raf` with `rafRef.current`. There are 5 occurrences:

1. Declaration — remove `let raf = 0` (no longer needed)
2. `raf = requestAnimationFrame(tick)` (inside `tick`) → `rafRef.current = requestAnimationFrame(tick)`
3. `raf = requestAnimationFrame(tick)` (initial call after `buildFloaters`) → `rafRef.current = requestAnimationFrame(tick)`
4. Inside `applyReducedMotion`:
   - `cancelAnimationFrame(raf)` → `cancelAnimationFrame(rafRef.current)`
   - `raf = 0` → `rafRef.current = 0`
   - `} else if (!raf) {` → `} else if (!rafRef.current) {`
   - `raf = requestAnimationFrame(tick)` → `rafRef.current = requestAnimationFrame(tick)`
5. Cleanup return: `cancelAnimationFrame(raf)` → `cancelAnimationFrame(rafRef.current)`

The inside of `tick` also calls `raf = requestAnimationFrame(tick)` as its last line — replace that too.

- [ ] **Step 3: Verify the build passes**

```bash
cd /Users/vishurajamani/vsc/glyphic-docs && pnpm build
```

Expected: build completes with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add components/marketing/RippleField.tsx
git commit -m "fix: move raf to ref so applyReducedMotion closure stays current (#19)"
```

---

## Task 3: Disable browser scroll restoration (issue #20, part 1)

**Files:**
- Modify: `app/layout.tsx`

**Problem:** Next.js App Router does not set `history.scrollRestoration` to `'manual'` by default. On a hard reload the browser uses `'auto'` and restores the previous scroll position before React hydrates. The landing page is long enough that this frequently lands mid-page.

The fix must run synchronously before hydration — a `useEffect` in a client component is too late. The correct approach is an inline `<script>` tag in the `<head>` rendered by the root Server Component layout.

- [ ] **Step 1: Add the inline script to `app/layout.tsx`**

Open `app/layout.tsx`. Inside the `<head>` block, add a `<script>` tag after the existing `<script type="application/ld+json">` block:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: "history.scrollRestoration = 'manual';",
  }}
/>
```

The full `<head>` block should look like:

```tsx
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
  />
  <script
    dangerouslySetInnerHTML={{
      __html: "history.scrollRestoration = 'manual';",
    }}
  />
</head>
```

- [ ] **Step 2: Verify the build passes**

```bash
cd /Users/vishurajamani/vsc/glyphic-docs && pnpm build
```

Expected: build completes with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "fix: set history.scrollRestoration=manual to prevent mid-page reload (#20)"
```

---

## Task 4: Scroll to top on LandingPage mount (issue #20, part 2)

**Files:**
- Modify: `components/marketing/LandingPage.tsx`

**Problem:** With `scrollRestoration = 'manual'`, the browser no longer auto-restores scroll position, but it also no longer auto-resets to the top. We need to explicitly scroll to top when the landing page mounts. This also guards against any client-side navigation that might leave a non-zero scroll offset.

- [ ] **Step 1: Add `useEffect` import and scroll-to-top effect**

Open `components/marketing/LandingPage.tsx`. The file currently imports `useRef` from React. Add `useEffect` to the import:

```tsx
import { useEffect, useRef } from 'react'
```

Then, inside the `LandingPage` component body, add this effect immediately after the `heroContentRef` declaration:

```tsx
useEffect(() => {
  window.scrollTo(0, 0)
}, [])
```

- [ ] **Step 2: Verify the build passes**

```bash
cd /Users/vishurajamani/vsc/glyphic-docs && pnpm build
```

Expected: build completes with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add components/marketing/LandingPage.tsx
git commit -m "fix: scroll to top on LandingPage mount (#20)"
```

---

## Self-Review Notes

- Task 1 fixes the stale rect — this is the primary cause of the mouseover effect going dead.
- Task 2 fixes the raf closure — secondary guard; without it, the reduced-motion toggle could kill the loop permanently.
- Tasks 3 + 4 together fix scroll restoration: Task 3 prevents the browser from restoring a stale scroll position; Task 4 ensures the page always starts at the top.
- No spec requirements are unaddressed.
- No placeholders or TBDs.
- Type/method names are consistent across all tasks.
