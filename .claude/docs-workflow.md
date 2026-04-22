# Glyphic Docs — Authoring Workflow

This file contains all instructions for creating, editing, and deleting documentation pages in `glyphic-docs`. Read this before touching any content.

---

## Content locations

| What | Where |
|------|-------|
| All published docs | `content/docs/` |
| Getting Started section | `content/docs/getting-started/` |
| Meta-block reference pages | `content/docs/meta-blocks/` |
| User guides | `content/docs/guides/` |
| Planned (unreleased) features | `content/docs/_planned/` |
| Blog posts | `content/blog/` |

**Never add `_planned/` pages to any `meta.json`.** They are intentionally hidden from the sidebar and sitemap.

---

## Creating a page

1. **Create the MDX file** in the correct section directory. Filename = URL slug (e.g. `animate.mdx` → `/docs/meta-blocks/animate`).

2. **Add required frontmatter:**
   ```mdx
   ---
   title: "Page Title"
   description: "One sentence describing this page — used in search and SEO."
   ---
   ```
   Both `title` and `description` are required. No other frontmatter fields are needed.

3. **Add the slug to `meta.json`** in the same directory. Add it to the `"pages"` array in the position where it should appear in the sidebar:
   ```json
   {
     "title": "Meta-blocks",
     "pages": ["index", "animate", "style", "status", "present", "compare"]
   }
   ```
   Exception: `_planned/` pages are never added to `meta.json`.

4. **Verify the build passes:**
   ```bash
   pnpm build
   ```

---

## Editing a page

Read the page first, then edit. After editing, run `pnpm build` to confirm the build passes before committing.

---

## Deleting a page

1. Delete the MDX file.
2. Remove the slug from `meta.json`.
3. Run `pnpm build` to confirm no broken references.
4. Commit.

---

## Interactive components

All components are from `fumadocs-ui` — no additional dependencies. Import directly in the MDX file.

### Import paths

```mdx
import { Tabs, Tab } from 'fumadocs-ui/components/tabs'
import { Accordions, Accordion } from 'fumadocs-ui/components/accordion'
import { Steps, Step } from 'fumadocs-ui/components/steps'
import { TypeTable } from 'fumadocs-ui/components/type-table'
import { Card, Cards } from 'fumadocs-ui/components/card'
```

`Callout` is provided by `defaultMdxComponents` automatically — no import needed.

### When to use each

| Component | Use when |
|-----------|----------|
| `<TypeTable>` | **Always** for parameter reference tables — never raw markdown tables for parameters |
| `<Tabs>` / `<Tab>` | A page covers 2+ parallel variants the user navigates between (not reads sequentially) |
| `<Accordions>` / `<Accordion>` | Reference details a user may skip on first read — variant descriptions, edge cases |
| `<Steps>` / `<Step>` | Any numbered how-to sequence |
| `<Cards>` / `<Card>` | Index/hub pages — linking to child pages |
| `<Callout type="info">` | Compatibility notes, tips |
| `<Callout type="warn">` | Gotchas, top of every `_planned/` page |
| `<Callout type="error">` | Breaking changes, destructive actions |

### `<TypeTable>` usage

```mdx
<TypeTable
  type={{
    paramName: {
      description: "What this parameter does",
      type: '"option-a" | "option-b"',
      default: "option-a",
    },
  }}
/>
```

---

## Source of truth

**`mermaid-studio/docs/guides/mmd-language-extensions.md`** is the authoritative parameter reference. Doc pages transcribe from it — do not paraphrase or invent parameters.

If content in `mmd-language-extensions.md` and a doc page conflict, `mmd-language-extensions.md` wins. Update the doc page.

---

## Promoting a `_planned/` page when a feature ships

1. In `mermaid-studio`, update `docs/guides/mmd-language-extensions.md` with the final parameter details.
2. In `glyphic-docs`, move the page from `content/docs/_planned/<directive>.mdx` to `content/docs/meta-blocks/<directive>.mdx`.
3. Add the slug to `content/docs/meta-blocks/meta.json`.
4. Remove the `<Callout type="warn">` "not yet implemented" banner from the top of the page.
5. Fill in full content from `mmd-language-extensions.md`.
6. Add a `<Card>` for the directive to `content/docs/meta-blocks/index.mdx` and `content/docs/index.mdx`.
7. Run `pnpm build` and commit.

---

## Issue tracking

Every doc change needs a GitHub issue in `SmilingArmadillo/glyphic-docs`. Use the `issue-tracking` skill for the exact steps. Reference the issue number in every commit message.
