# Theme Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-theme visual system (Warm, Dark Tech, Indigo) with a sidebar footer picker that persists the user's choice to `localStorage` and applies it on every visit with no flash.

**Architecture:** CSS custom properties on `[data-theme]` attribute of `<html>` drive all visual differences; a React context manages reading/writing `localStorage` and the DOM attribute; an inline `<script>` in `<head>` eliminates flash on load. A `ThemePicker` swatch component in the Fumadocs sidebar footer and a `GlassCard` MDX component round out the visible changes.

**Tech Stack:** Next.js 14 App Router, Fumadocs UI 13, Tailwind CSS 3, TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/globals.css` | Modify | Add `[data-theme]` blocks, `--glass-*` + `--code-*` vars, font smoothing, shiki token overrides |
| `lib/theme.tsx` | Create | `ThemeProvider` + `useTheme` hook |
| `app/layout.tsx` | Modify | Add SSR flash-prevention script; wrap with `ThemeProvider` |
| `components/ThemePicker.tsx` | Create | Three swatch buttons in sidebar footer |
| `components/GlassCard.tsx` | Create | Glass card MDX component |
| `app/docs/layout.tsx` | Modify | Pass `sidebar.footer` with `ThemePicker` |
| `app/docs/[[...slug]]/page.tsx` | Modify | Add `GlassCard` to `defaultMdxComponents` |

---

### Task 1: CSS theme definitions

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add font smoothing to body rule**

Open `app/globals.css`. Find the existing `body` rule (currently just `font-family`) and replace it:

```css
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 2: Add the three `[data-theme]` blocks**

Append to the end of `app/globals.css`:

```css
/* ── Theme: Warm (default) ── */
[data-theme="warm"] {
  --background: 50 33% 97%;
  --foreground: 0 0% 10%;
  --primary: 239 84% 67%;
  --primary-foreground: 0 0% 100%;
  --muted: 45 25% 94%;
  --muted-foreground: 0 0% 42%;
  --border: 40 20% 88%;
  --card: 45 25% 94%;
  --card-foreground: 0 0% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 10%;
  --secondary: 45 25% 94%;
  --secondary-foreground: 0 0% 10%;
  --accent: 45 25% 94%;
  --accent-foreground: 0 0% 10%;
  --ring: 239 84% 67%;

  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(229, 227, 218, 0.8);
  --glass-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  --code-keyword: #6b35dc;
  --code-string: #c27d3a;
  --code-comment: #8e8e8e;
  --code-const: #15593b;
}

/* ── Theme: Dark Tech ── */
[data-theme="dark-tech"] {
  --background: 215 20% 7%;
  --foreground: 210 17% 88%;
  --primary: 152 68% 57%;
  --primary-foreground: 215 20% 7%;
  --muted: 215 14% 12%;
  --muted-foreground: 215 10% 55%;
  --border: 215 14% 18%;
  --card: 215 14% 10%;
  --card-foreground: 210 17% 88%;
  --popover: 215 14% 10%;
  --popover-foreground: 210 17% 88%;
  --secondary: 215 14% 12%;
  --secondary-foreground: 210 17% 88%;
  --accent: 215 14% 12%;
  --accent-foreground: 210 17% 88%;
  --ring: 152 68% 57%;

  --glass-bg: rgba(22, 27, 34, 0.8);
  --glass-border: rgba(255, 255, 255, 0.07);
  --glass-shadow: 0 0 0 1px rgba(62, 207, 142, 0.05), 0 4px 16px rgba(0, 0, 0, 0.3);

  --code-keyword: #bda4ff;
  --code-string: #ffcda1;
  --code-comment: #7e7e7e;
  --code-const: #3ecf8e;
}

/* ── Theme: Indigo Elevated ── */
[data-theme="indigo"] {
  --background: 240 33% 99%;
  --foreground: 240 20% 11%;
  --primary: 239 84% 60%;
  --primary-foreground: 0 0% 100%;
  --muted: 240 20% 96%;
  --muted-foreground: 240 10% 45%;
  --border: 240 20% 88%;
  --card: 240 20% 97%;
  --card-foreground: 240 20% 11%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 20% 11%;
  --secondary: 240 20% 96%;
  --secondary-foreground: 240 20% 11%;
  --accent: 240 20% 96%;
  --accent-foreground: 240 20% 11%;
  --ring: 239 84% 60%;

  --glass-bg: rgba(255, 255, 255, 0.8);
  --glass-border: rgba(99, 102, 241, 0.15);
  --glass-shadow: 0 2px 12px rgba(99, 102, 241, 0.08), 0 0 0 1px rgba(99, 102, 241, 0.05);

  --code-keyword: #6b35dc;
  --code-string: #be3434;
  --code-comment: #6366f1;
  --code-const: #0f7a52;
}
```

- [ ] **Step 3: Add shiki token colour overrides**

Append to the end of `app/globals.css`. Fumadocs uses Shiki whose output tokens have `.token.keyword` etc. inside `[data-rehype-pretty-code-figure]` code blocks:

```css
/* ── Shiki token overrides — driven by theme vars ── */
[data-rehype-pretty-code-figure] .token.keyword,
[data-rehype-pretty-code-figure] span[style*="--shiki-light:#6f42c1"],
[data-rehype-pretty-code-figure] span[style*="--shiki-dark:#f97583"] {
  color: var(--code-keyword) !important;
}

[data-rehype-pretty-code-figure] .token.string,
[data-rehype-pretty-code-figure] span[style*="--shiki-light:#032f62"],
[data-rehype-pretty-code-figure] span[style*="--shiki-dark:#9ecbff"] {
  color: var(--code-string) !important;
}

[data-rehype-pretty-code-figure] .token.comment,
[data-rehype-pretty-code-figure] span[style*="--shiki-light:#6a737d"],
[data-rehype-pretty-code-figure] span[style*="--shiki-dark:#6a737d"] {
  color: var(--code-comment) !important;
}

[data-rehype-pretty-code-figure] .token.constant,
[data-rehype-pretty-code-figure] span[style*="--shiki-light:#005cc5"],
[data-rehype-pretty-code-figure] span[style*="--shiki-dark:#79b8ff"] {
  color: var(--code-const) !important;
}
```

- [ ] **Step 4: Start dev server and verify visually**

```bash
pnpm dev
```

Open http://localhost:3000/docs in browser. The page should look identical to before (warm theme is default, same values as current `:root`). No regressions.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat: add CSS theme definitions and font smoothing"
```

---

### Task 2: Theme context and persistence

**Files:**
- Create: `lib/theme.tsx`

- [ ] **Step 1: Create `lib/theme.tsx`**

```tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'warm' | 'dark-tech' | 'indigo'

const STORAGE_KEY = 'glyphic-theme'
const DEFAULT_THEME: Theme = 'warm'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && ['warm', 'dark-tech', 'indigo'].includes(stored)) {
      setThemeState(stored)
      document.documentElement.dataset.theme = stored
    }
  }, [])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    document.documentElement.dataset.theme = t
    localStorage.setItem(STORAGE_KEY, t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
```

- [ ] **Step 2: Add SSR flash-prevention script and `ThemeProvider` to `app/layout.tsx`**

Open `app/layout.tsx`. Make two changes:

**a)** Add the inline script to `<head>` (before the font links):

```tsx
<head>
  <script
    dangerouslySetInnerHTML={{
      __html: `(function(){try{var t=localStorage.getItem('glyphic-theme');if(t&&['warm','dark-tech','indigo'].includes(t))document.documentElement.dataset.theme=t;}catch(e){}})();`,
    }}
  />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  {/* ... rest of head unchanged */}
```

**b)** Import `ThemeProvider` and wrap `RootProvider`:

```tsx
import { ThemeProvider } from '@/lib/theme'

// inside <body>:
<body>
  <ThemeProvider>
    <RootProvider>{children}</RootProvider>
  </ThemeProvider>
</body>
```

The full updated `app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { RootProvider } from 'fumadocs-ui/provider'
import { ThemeProvider } from '@/lib/theme'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://glyphic.cc'),
  title: {
    template: '%s — Glyphic',
    default: 'Glyphic Docs',
  },
  description: 'Documentation for Glyphic — the visual Mermaid diagram editor.',
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Glyphic',
  url: 'https://glyphic.cc',
  logo: 'https://glyphic.cc/logo.svg',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('glyphic-theme');if(t&&['warm','dark-tech','indigo'].includes(t))document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body>
        <ThemeProvider>
          <RootProvider>{children}</RootProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify no TypeScript errors**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 4: Verify dev server still loads correctly**

Open http://localhost:3000/docs. Should look identical — no flash, no console errors.

- [ ] **Step 5: Commit**

```bash
git add lib/theme.tsx app/layout.tsx
git commit -m "feat: add theme context, localStorage persistence, SSR flash prevention"
```

---

### Task 3: ThemePicker component

**Files:**
- Create: `components/ThemePicker.tsx`
- Modify: `app/docs/layout.tsx`

- [ ] **Step 1: Create `components/ThemePicker.tsx`**

```tsx
'use client'

import { useTheme, type Theme } from '@/lib/theme'

const THEMES: { key: Theme; label: string; swatch: string }[] = [
  { key: 'warm',      label: 'Warm',       swatch: '#C8B88A' },
  { key: 'dark-tech', label: 'Dark',       swatch: '#3ECF8E' },
  { key: 'indigo',    label: 'Indigo',     swatch: '#6366F1' },
]

export default function ThemePicker() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="px-3 py-3 border-t border-[hsl(var(--border))]">
      <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-2">
        Theme
      </p>
      <div className="flex gap-2">
        {THEMES.map(({ key, label, swatch }) => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            title={label}
            className="flex flex-col items-center gap-1 group"
          >
            <span
              className="block w-5 h-5 rounded-full transition-shadow duration-150"
              style={{
                background: swatch,
                boxShadow:
                  theme === key
                    ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${swatch}`
                    : '0 0 0 1px rgba(0,0,0,0.1)',
              }}
            />
            <span className="text-[9px] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add `ThemePicker` to sidebar footer in `app/docs/layout.tsx`**

Full updated file:

```tsx
import { DocsLayout } from 'fumadocs-ui/layout'
import type { ReactNode } from 'react'
import { source } from '@/lib/source'
import { baseOptions } from '@/app/layout.config'
import DocsNav from '@/components/DocsNav'
import DocsFooter from '@/components/DocsFooter'
import ThemePicker from '@/components/ThemePicker'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <DocsNav />
      <DocsLayout
        tree={source.pageTree}
        {...baseOptions}
        sidebar={{ footer: <ThemePicker /> }}
      >
        {children}
      </DocsLayout>
      <DocsFooter />
    </>
  )
}
```

- [ ] **Step 3: Verify in browser**

Open http://localhost:3000/docs. Scroll to the bottom of the sidebar — three swatches should appear. Clicking each should immediately change the page's visual appearance. Reload the page — the chosen theme should persist.

- [ ] **Step 4: Verify all three themes look correct**

Check each theme:
- **Warm**: cream background, indigo sidebar active item
- **Dark Tech**: near-black background, green active item and accents
- **Indigo**: cool-white background, indigo glass-tinted sidebar active item

- [ ] **Step 5: Commit**

```bash
git add components/ThemePicker.tsx app/docs/layout.tsx
git commit -m "feat: add ThemePicker to sidebar footer"
```

---

### Task 4: GlassCard component

**Files:**
- Create: `components/GlassCard.tsx`
- Modify: `app/docs/[[...slug]]/page.tsx`

- [ ] **Step 1: Create `components/GlassCard.tsx`**

```tsx
import type { ReactNode } from 'react'

interface GlassCardProps {
  title: string
  icon?: ReactNode
  children: ReactNode
}

export default function GlassCard({ title, icon, children }: GlassCardProps) {
  return (
    <div
      className="rounded-xl p-4 my-4"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{title}</span>
      </div>
      <div className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Register `GlassCard` in MDX components**

Open `app/docs/[[...slug]]/page.tsx`. Import `GlassCard` and spread it into the components passed to `<MDX>`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { source } from '@/lib/source'
import { DocsPage, DocsBody, DocsTitle, DocsDescription } from 'fumadocs-ui/page'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import GlassCard from '@/components/GlassCard'

// ... generateStaticParams, generateMetadata unchanged ...

export default async function Page({ params }: Props) {
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body

  const jsonLd = { /* unchanged */ }

  return (
    <DocsPage toc={page.data.toc} tableOfContent={{ style: 'clerk' }} tableOfContentPopover={{ style: 'clerk' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents, GlassCard }} />
      </DocsBody>
    </DocsPage>
  )
}
```

- [ ] **Step 3: Smoke-test `GlassCard` in an MDX page**

Open any existing MDX file in `content/docs/` — e.g. `content/docs/getting-started/introduction.mdx`. Add a temporary `GlassCard` block anywhere:

```mdx
<GlassCard title="Try it out">
  This is a glass card. Switch themes in the sidebar to see it adapt.
</GlassCard>
```

Open http://localhost:3000/docs (or the corresponding page) and verify:
- Card renders with correct glass background for current theme
- Switching themes updates the card appearance immediately
- Remove the temporary block after verifying.

- [ ] **Step 4: Lint check**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/GlassCard.tsx app/docs/\[\[...slug\]\]/page.tsx
git commit -m "feat: add GlassCard MDX component with theme-aware glass styling"
```

---

### Task 5: Production build verification

**Files:** none changed

- [ ] **Step 1: Run the full build**

```bash
pnpm build
```

Expected: build completes without errors. The two-stage build runs `node scripts/build-llms.mjs` then `next build`.

- [ ] **Step 2: Serve and verify**

```bash
pnpm start
```

Open http://localhost:3000/docs. Verify:
- Theme picker appears in sidebar footer
- Selecting a theme persists on reload
- All three themes render correctly
- No console errors

- [ ] **Step 3: Final commit if any last fixes needed, then push**

```bash
git push origin feature/supabase-styling
```
