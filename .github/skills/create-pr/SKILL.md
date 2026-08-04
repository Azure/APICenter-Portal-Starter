---
name: create-pr
description: |
  Create a pull request for the API Center Portal from the current changes.
  Ensures a clear, descriptive title that follows semantic (Conventional Commits) naming,
  a well-structured description, and a clean branch/commit before opening the PR.

  Use when:
  - "Create a PR"
  - "Open a pull request for my changes"
  - "Raise a PR for the current branch"
  - "Submit my work for review"
---

# Create a Pull Request

Creates a pull request for the current changes against the `Azure/APICenter-Portal-Starter` repository (default base branch: `main`).

## Core Requirements

Every PR created with this skill MUST have:

1. **A good, descriptive title that follows semantic naming.**
   Use the [Conventional Commits](https://www.conventionalcommits.org/) prefix format:

   ```
   <type>: <imperative summary>
   ```

   Examples:
   - `feat: Add remote/local dropdown to MCP install button`
   - `fix: Hide Contains operator for enum filters in Add filter dropdown`
   - `refactor: Extract filter operator logic into useSearchFilters`
   - `docs: Document Add filter dropdown behavior in wiki`

   Allowed `type` values:
   | Type | Use for |
   |------|---------|
   | `feat` | A new feature or user-facing capability |
   | `fix` | A bug fix |
   | `refactor` | Code change that neither fixes a bug nor adds a feature |
   | `docs` | Documentation only |
   | `style` | Formatting, whitespace, no logic change |
   | `test` | Adding or fixing tests |
   | `chore` | Build, tooling, dependencies, config |
   | `perf` | Performance improvement |

   Rules for the title:
   - Keep the summary in the **imperative mood** ("Add", not "Added"/"Adds").
   - Be specific — name the component or area touched (e.g. "MCP install button", "Add filter dropdown").
   - Keep it under ~72 characters.
   - Do not end with a period.

2. **A clear description** that explains the change. Use this structure:

   ```markdown
   ## Summary
   <1-3 sentences describing what changed and why>

   ## Changes
   - <bullet per meaningful change>

   ## Testing
   - <how it was verified: lint, build, manual UI check, etc.>
   ```

## Workflow

### Step 1: Review the changes

```powershell
git status
git diff
```

Understand what changed so the title and description are accurate. Confirm there are no unintended files staged.

### Step 2: Create a feature branch (if on `main`)

Never push directly to `main`. If the current branch is `main`, create a semantically named branch derived from the change type:

```powershell
git checkout -b feat/mcp-install-remote-local-dropdown
```

Branch naming: `<type>/<kebab-case-summary>` (e.g. `fix/enum-filter-operators`).

### Step 3: Stage and commit

Use a commit message that matches the PR title convention:

```powershell
git add <files>
git commit -m "feat: Add remote/local dropdown to MCP install button"
```

Prefer staging specific files over `git add -A` to avoid committing unrelated work.

### Step 4: Push the branch

```powershell
git push -u origin <branch-name>
```

### Step 5: Open the PR

Preferred (GitHub CLI):

```powershell
gh pr create --base main --title "feat: Add remote/local dropdown to MCP install button" --body-file <path-to-body.md>
```

If `gh` is not authenticated (`gh auth status` fails), stop and tell the user to run `gh auth login`, OR provide the compare URL so they can open the PR in the browser:

```
https://github.com/Azure/APICenter-Portal-Starter/compare/main...<branch-name>?expand=1
```

### Step 6: Report back

Share the PR URL (or the compare URL) and the final title with the user.

## Guardrails

- **Confirm before pushing.** Pushing a branch and opening a PR are shared-state actions — confirm with the user before running Step 4 onward if there is any ambiguity.
- **Never force-push** (`--force`) or push directly to `main`.
- **Validate before committing.** Ensure the project still builds / lints (`npm run lint`, `npm run build`) when relevant.
- **Keep PRs focused.** If the working tree contains unrelated changes, ask the user before bundling them into one PR.
