# Blog Design Spec

**Date:** 2026-04-22  
**Status:** Approved

## Overview

Add a `/blog` section to glyphic-docs for product updates and tutorials. No new dependencies — uses the existing Fumadocs MDX pipeline with a second content collection.

## Architecture

The blog is a new Next.js route at `/blog`, independent of the Fumadocs docs section.

**Content flow:**
1. MDX files in `content/blog/`
2. `source.config.ts` gains a `blog` collection (alongside the existing `docs` collection)
3. `lib/source.ts` exports a `blog` loader with `baseUrl: '/blog'`
4. `app/blog/page.tsx` renders the index
5. `app/blog/[slug]/page.tsx` renders individual posts

## Frontmatter Schema

Each post uses the following frontmatter:

```mdx
---
title: Introducing smart deal scoring
description: Glyphic now automatically scores deals based on your CRM activity and call history.
date: 2025-04-18
tag: update
---
```

- `title` — required. Post heading and `<title>` tag.
- `description` — required. Used on index card and as meta description.
- `date` — required. ISO 8601 (`YYYY-MM-DD`). Drives sort order.
- `tag` — required. Either `update` or `tutorial`. Drives colour-coded pill.
- Filename becomes the URL slug (e.g. `smart-deal-scoring.mdx` → `/blog/smart-deal-scoring`).

## Pages

### `/blog` — Index page (`app/blog/page.tsx`)

Layout: **Featured + list** (Option C from design review).

- Page header: eyebrow "Blog", h1 "Updates & guides", subtitle "Product news, tutorials, and everything Glyphic."
- **Featured card** — latest post rendered as a hero: tinted cover area (indigo gradient), tag pill, date, title, description.
- **Compact list** — all other posts in date-descending order. Each row: date, tag pill, title, arrow.
- Uses `DocsNav` and `DocsFooter`.
- No sidebar.
- Statically generated at build time.

### `/blog/[slug]` — Post page (`app/blog/[slug]/page.tsx`)

- `generateStaticParams` from `blog.getPages()`.
- `generateMetadata` from post frontmatter (title + description).
- Renders: tag pill, date, h1 title, MDX body with same syntax highlighting as docs (`github-light` / `github-dark-dimmed`).
- No sidebar.
- Uses `DocsNav` and `DocsFooter`.
- 404 via `notFound()` for unknown slugs.

## Source configuration

Use `defineCollections` (not `defineDocs`) — blog posts don't need `meta.json` sidebar ordering.

`source.config.ts` additions:

```ts
import { defineCollections, defineConfig } from 'fumadocs-mdx/config'
import { z } from 'zod'

export const blog = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(), // ISO 8601
    tag: z.enum(['update', 'tutorial']),
  }),
})
```

`lib/source.ts` addition:

```ts
import { blog as blogCollection } from '@/.source'

export const blog = loader({
  baseUrl: '/blog',
  source: createMDXSource(blogCollection),
})
```

## SEO

- Each post: `generateMetadata` sets `title` and `description` from frontmatter.
- `app/sitemap.ts`: add `/blog` and all post URLs (map `blog.getPages()` to `{ url, lastModified }`).
- No other changes needed — existing canonical base (`https://glyphic.cc`) and JSON-LD apply automatically.

## Sample content

One sample post to be created at `content/blog/introducing-deal-scoring.mdx` to validate the pipeline end-to-end.

## Out of scope

- Author attribution (deferred)
- Pagination (not needed at launch)
- RSS feed (not needed at launch)
- Cover image uploads (tinted gradient placeholders used instead)
- Tag filtering on index page
