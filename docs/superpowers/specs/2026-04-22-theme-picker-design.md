# Theme Picker Design

Date: 2026-04-22
Issue: #5

## Summary

Add a user-selectable, persisted visual theme system to glyphic-docs, inspired by Supabase's styling techniques. Users pick from three themes via a sidebar footer picker; the choice is saved to `localStorage` and applied on every visit with no flash.

## Themes

Three themes, each self-contained (no separate light/dark toggle — each theme implies its own mode):

| Key | Name | Background | Accent | Character |
|-----|------|-----------|--------|-----------|
| `warm` | Warm Polish | `#FAF9F4` (cream) | `#6366F1` (indigo) | Today's identity, elevated |
| `dark-tech` | Dark Technical | `#0D1117` (near-black) | `#3ECF8E` (green) | Supabase-style developer feel |
| `indigo` | Indigo Elevated | `#FAFAFE` (cool white) | `#6366F1` (indigo) | Light base, dramatic glass depth |

## CSS Architecture

### Approach

CSS custom property overrides on `[data-theme]` attribute of `<html>`. Extends the existing Fumadocs variable system — no fighting the framework.

### New shared custom properties (all three themes define these)

```css
--glass-bg          /* glass card/panel backdrop colour */
--glass-border      /* glass card border */
--glass-shadow      /* glass card box-shadow */
--code-keyword      /* syntax: keyword token colour */
--code-string       /* syntax: string token colour */
--code-comment      /* syntax: comment token colour */
--code-const        /* syntax: constant/identifier token colour */
```

### Theme blocks in `globals.css`

Three `[data-theme="..."]` blocks added below the existing `:root` and `.dark` blocks. The existing `:root` block becomes the fallback and is equivalent to `warm`.

### Font smoothing

Added once to the `body` rule:
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### Syntax token overrides

Shiki CSS class overrides (`.token.keyword` etc.) mapped to `--code-*` vars per theme, added to `globals.css`. No changes to `source.config.ts` needed.

## Theme Context & Persistence

### File: `lib/theme.tsx`

Exports:
- `ThemeProvider` — React context provider. On mount: reads `localStorage.getItem('glyphic-theme')`, sets `document.documentElement.dataset.theme`, defaults to `"warm"`. On change: writes to `localStorage` and updates the attribute.
- `useTheme()` — returns `{ theme, setTheme }`.

### SSR flash prevention

An inline `<script>` injected into `<head>` in `app/layout.tsx` (before any stylesheets) reads `localStorage` and sets `data-theme` synchronously. This ensures the correct theme is applied before first paint with zero flicker — same pattern Next.js uses for dark mode.

### Integration

`ThemeProvider` wraps `RootProvider` in `app/layout.tsx`.

## Theme Picker UI

### File: `components/ThemePicker.tsx`

Client component. Renders three circular swatches:
- Warm → `#C8B88A` (warm sand)
- Dark Tech → `#3ECF8E` (green)
- Indigo → `#6366F1` (indigo)

Active swatch gets a ring indicator. Clicking calls `setTheme()`. No text labels needed once selected.

### Placement

Sidebar footer via Fumadocs `DocsLayout`'s `sidebar.footer` slot in `app/docs/layout.tsx`. Separated from nav items by a thin border.

## Glass Card Component

### File: `components/GlassCard.tsx`

Simple wrapper div consuming `--glass-bg`, `--glass-border`, `--glass-shadow`. Props: `title` (string), `icon` (optional ReactNode), `children`.

Registered in the Fumadocs MDX component registry so it's available in `.mdx` files as `<GlassCard>`.

## File Changelist

| File | Change |
|------|--------|
| `app/globals.css` | Add `[data-theme]` blocks, `--glass-*` + `--code-*` vars, font smoothing, shiki token overrides |
| `app/layout.tsx` | Add SSR flash-prevention inline script; wrap with `ThemeProvider` |
| `lib/theme.tsx` | New — `ThemeProvider` + `useTheme` |
| `components/ThemePicker.tsx` | New — swatch picker UI |
| `components/GlassCard.tsx` | New — glass card MDX component |
| `app/docs/layout.tsx` | Add `sidebar.footer` with `ThemePicker` |
| `lib/source.ts` or MDX config | Register `GlassCard` in component registry |

## Out of Scope

- Framer Motion / JS animations (pure CSS transitions only)
- Per-theme dark variants (each theme is one fixed mode)
- Any changes to content MDX files
