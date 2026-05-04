# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Scope

Only edit files within this repository (`glyphic-docs`). Never read, modify, or create files in other repositories (e.g. `mermaid-studio`) unless the user explicitly grants permission for that specific task.

## Issue Tracking

Every work item must have a GitHub issue and a `ROADMAP.md` entry. Use the `issue-tracking` skill — it covers the exact steps for opening and closing issues and keeping `ROADMAP.md` in sync.

- Repo: `SmilingArmadillo/glyphic-docs`
- Project board: [Glyphic Docs](https://github.com/users/SmilingArmadillo/projects/4)
- Labels: `type: bug`, `type: content`, `type: feedback`, `priority: high`, `priority: low`

## Commands

```bash
pnpm dev          # Start dev server at localhost:3000
pnpm build        # Generate LLM docs + Next.js production build
pnpm start        # Serve production build
pnpm lint         # Run ESLint
```

The build is two-stage: `node scripts/build-llms.mjs` runs first to generate `/public/llms.txt` and `/public/llms-full.txt`, then `next build` compiles the site.

There are no automated tests in this project.

## Architecture

This is a **Next.js 14 (App Router)** documentation site powered by **Fumadocs**.

### Content Flow

MDX files in `content/docs/` → Fumadocs MDX processor → `lib/source.ts` loader → `app/docs/[[...slug]]/page.tsx` renders each page dynamically via `getPage(slug)`.

The Fumadocs page tree (sidebar structure) is auto-generated from the MDX file hierarchy and frontmatter. Navigation order is controlled by `meta.json` files within each section directory.

### Key Directories

- `content/docs/` — All documentation source (MDX). Organized into `getting-started/`, `guides/`, and `api-reference/`.
- `app/` — Next.js App Router. `app/docs/layout.tsx` wraps all doc pages with the Fumadocs DocsLayout (sidebar, nav). `app/layout.config.tsx` configures global Fumadocs-UI options (logo, nav links).
- `components/` — Custom React components: `DocsNav.tsx` (header) and `DocsFooter.tsx` (footer). These are not Fumadocs built-ins.
- `lib/source.ts` — Fumadocs source loader. This is the bridge between compiled MDX and the page router.
- `scripts/build-llms.mjs` — Pre-build script that reads all MDX files and writes AI-friendly plain-text docs to `public/`.

### Fumadocs Configuration

- `source.config.ts` — Defines MDX options: syntax highlighting themes (`github-light`/`github-dark`), remark/rehype plugins
- `next.config.mjs` — Wraps the Next.js config with `createMDX()` from `fumadocs-mdx`

### Path Alias

`@/*` maps to the project root (defined in `tsconfig.json`). Use for all internal imports.

### Metadata & SEO

Canonical URL base is `https://glyphic.cc`. Structured data (JSON-LD) for Organization and TechArticle is emitted in `app/layout.tsx`. Sitemap and robots.txt are generated via Next.js route handlers in `app/sitemap.ts` and `app/robots.ts`.

## Documentation Authoring

For all instructions on creating, editing, and deleting doc pages — including content structure, interactive components, source-of-truth rules, and the `_planned/` promotion workflow — see [`.claude/docs-workflow.md`](.claude/docs-workflow.md).
