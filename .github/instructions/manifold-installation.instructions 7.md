---
applyTo: "**"
---
# Installing @coreai-microsoft/manifold-fluentui-react

The package is published to **GitHub Packages** (not npmjs.com). Standard
`npm install` will fail with `401` until authentication is configured.

---

## Preflight — Verify account and org access

Run these checks before attempting to install. Fix any failures before proceeding.

```bash
# 1. Confirm you are signed into the correct GitHub account
gh auth status
# Expected: "Logged in to github.com as <your-microsoft-alias>"
# If wrong account: gh auth logout, then gh auth login

# 2. Confirm the coreai-microsoft org is accessible
gh api /orgs/coreai-microsoft --jq '.login' 2>&1
# Expected output: "coreai-microsoft"
# If you get "Must have push access" or 404, you need org membership or SAML SSO grant

# 3. Confirm read:packages scope is active on your token
gh auth status --show-token 2>/dev/null | grep -i packages || \
  echo "run: gh auth refresh -h github.com -s read:packages"
```

| Result | Action |
|---|---|
| Wrong account | `gh auth logout` then `gh auth login` with your Microsoft alias |
| Org 404 / no access | Request membership in the `coreai-microsoft` GitHub org |
| Missing `read:packages` scope | Run Step 1 below (`gh auth refresh`) |
| SAML enforcement error | Re-run `gh auth refresh -h github.com -s read:packages` to re-authorise SSO |

> **AI agents:** do not run `gh auth login` or `gh auth logout` unattended. These
> are interactive commands. Show the user the preflight output and ask them to
> resolve any failures before continuing.

---

## Step 1 — Authenticate (run once per machine, interactive)

> **AI agents MUST NOT run `gh auth refresh` unattended** — it opens a browser for
> SSO. Prompt the user to run these two commands themselves before continuing.

```bash
# Authorise the GitHub CLI for the read:packages scope (browser SSO)
gh auth refresh -h github.com -s read:packages

# Write the token to your global npm config
npm config set //npm.pkg.github.com/:_authToken "$(gh auth token)"
```

On a `401` later, re-run the `npm config set` line (the token rotates).  
On a `403 … SAML enforcement`, re-run `gh auth refresh`.

---

## Step 2 — Scope the registry (already committed in this repo)

The project `.npmrc` at the repo root already contains:

```ini
@coreai-microsoft:registry=https://npm.pkg.github.com
```

Do not modify or delete this file.

---

## Step 3 — Install

```bash
npm install @coreai-microsoft/manifold-fluentui-react \
            @fluentui/react-components \
            @fluentui/react-datepicker-compat \
            @fluentui/react-timepicker-compat
```

Current pinned version in this repo: `^0.1.2`

---

## GitHub Actions (CI)

Skip `gh auth refresh` in CI. Use the built-in `GITHUB_TOKEN` instead:

```yaml
- name: Install dependencies
  run: npm ci
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Ensure the workflow's `permissions` block includes `packages: read`.
