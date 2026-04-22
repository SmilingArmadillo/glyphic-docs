# Design: GitHub Ticketing System + Local Roadmap

**Date:** 2026-04-22  
**Repo:** SmilingArmadillo/glyphic-docs  
**Scope:** Solo workflow for tracking documentation tasks and user feedback

---

## Overview

Set up a lightweight ticketing system using GitHub Issues + a GitHub Project (v2) board, with a local `ROADMAP.md` as a manually-maintained snapshot of open issues.

---

## GitHub Issues

All work items are tracked as GitHub Issues on `SmilingArmadillo/glyphic-docs`.

### Labels

| Label | Purpose |
|-------|---------|
| `type: bug` | Broken pages, bad links, rendering issues |
| `type: content` | New or updated documentation |
| `type: feedback` | Feature requests or reports from docs readers |
| `priority: high` | Needs attention soon |
| `priority: low` | Nice to have, no urgency |

### Milestones

Added manually as themes emerge (e.g. "API Docs v1", "Launch Readiness"). No predefined milestones at setup time.

---

## GitHub Project Board

- **Type:** GitHub Projects v2 (board view)
- **Name:** Glyphic Docs
- **Owner:** SmilingArmadillo account
- **Linked repo:** glyphic-docs
- **Columns:** Todo / In Progress / Done (default board workflow)
- Issues from `glyphic-docs` are added to the board automatically via repo filter

---

## Local ROADMAP.md

Located at the repo root. Updated manually when issue states change — no automation.

### Structure

```markdown
# Roadmap

Last updated: YYYY-MM-DD

## Open Issues

| # | Title | Label | Status |
|---|-------|-------|--------|
| #N | ... | type: content | Open |

## Recently Closed

| # | Title | Closed |
|---|-------|--------|
| #N | ... | YYYY-MM-DD |
```

### Update Convention

Before committing, update `ROADMAP.md` to reflect any issues opened, closed, or relabelled in that session. The "Last updated" date is always refreshed.

---

## What's Out of Scope

- Automation / GitHub Actions to sync ROADMAP.md
- Public issue templates (solo workflow, not needed)
- Multiple assignees or team triage flows
