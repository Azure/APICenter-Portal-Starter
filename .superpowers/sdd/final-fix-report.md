# Final Whole-Branch Review — Fix Report

## Status
Complete. All three review findings (1 blocking, 2 additional) fixed via TDD, validated, committed.

## Scope
This is one coherent MSAL v5 hardening wave, addressing the final whole-branch review of the
Entra popup login work:

1. **Blocking**: `logoutPopup()` needs `postLogoutRedirectUri` pointed at the dedicated bridge.
2. **Additional**: Bridge responses must never be cached (Azure Static Web Apps route config).
3. **Additional**: `getMsalClient()` must allow retry after `PublicClientApplication.initialize()`
   rejects, instead of caching a permanently-rejected promise.

## TDD Process (skill invoked before any implementation change)

For every finding: wrote/extended a failing test, watched it fail for the expected reason, then
wrote the minimal code to make it pass, then re-ran the full suite to confirm no regressions.

### Finding 1 — `postLogoutRedirectUri`
- **RED**: Extended `src/services/MsalClient.test.ts` to assert
  `postLogoutRedirectUri: 'http://localhost:3000/entraid-redirect.html'` in the
  `PublicClientApplication` constructor call, plus a new test
  `configures the same dedicated bridge URI for redirect and post-logout redirect` asserting both
  fields are present and equal. Ran `npx vitest run src/services/MsalClient.test.ts` — 2 failures,
  both for the expected reason (`postLogoutRedirectUri` missing/`undefined`).
- **GREEN**: Added `postLogoutRedirectUri: getEntraRedirectUri()` next to `redirectUri` in
  `src/services/MsalClient.ts`. Re-ran — all tests passed. The lazy singleton and existing
  `redirectUri`/authority/account-restoration behavior are unchanged.

### Finding 3 — retry after `initialize()` rejection
(Done before finding 2 since it's in the same file/module.)
- **RED**: Added test `propagates the first initialization rejection and retries with a fresh
  client on the next call` — first `getMsalClient()` call rejects (mocked `initialize()` rejection
  via `mockRejectedValueOnce`), then a second call must succeed with a *new*
  `PublicClientApplication` (called twice total) and a fresh `initialize()` (called twice total).
  Ran the test — failed with the raw `init failed` error, confirming the rejection wasn't handled
  and (implicitly) that the cached promise would keep rejecting forever without a fix.
- **GREEN**: Changed `getMsalClient()` so `msalInstancePromise` chains a `.catch()` that clears
  `msalInstancePromise = undefined` before rethrowing. Concurrent callers still resolve to the same
  promise/instance while `msalInstancePromise` is set (unchanged existing
  "initializes one client for concurrent callers" test still passes), and a later call after a
  rejection creates and initializes a brand-new client.

### Finding 2 — no-cache Static Web Apps route for the bridge
- **RED**: Created `src/public/staticwebapp.config.test.ts` (new `src/public/` dir — Vite's
  `publicDir`) importing the not-yet-existing `staticwebapp.config.json` and asserting the exact
  route/header shape for `/entraid-redirect.html`. Ran it — failed with `ENOENT` (file didn't
  exist), the expected "feature missing" failure.
- **GREEN**: Added `src/public/staticwebapp.config.json`:
  ```json
  {
    "routes": [
      {
        "route": "/entraid-redirect.html",
        "headers": { "cache-control": "no-store" }
      }
    ]
  }
  ```
  No COOP header is present on that route (or anywhere else in the file). Since Vite's
  `publicDir` is `./src/public` (see `vite.config.ts`), this file is copied verbatim to
  `dist/staticwebapp.config.json` on every `npm run build`, with no build-script changes needed.
  Verified the test passes, then verified via an actual `npm run build` that `dist/staticwebapp.config.json`
  exists and parses to the exact expected route/header shape (see Validation below).
- Docs updated (source-of-truth per repo custom instructions):
  - `.wiki/deployment.md`: replaced the speculative "if exists, TODO: verify" Static Web App
    Configuration section with the real file path, purpose (no-store + no-COOP), and the actual
    config JSON; added `staticwebapp.config.json` to the documented `dist/` build output tree;
    checked off the corresponding TODO bullet; updated the "Register redirect URI" manual-deploy
    step to mention both no-COOP and no-store.
  - `.wiki/authentication.md`: extended the "Shared client initialization" section to describe
    `postLogoutRedirectUri` reuse and the no-store cache-control requirement alongside the existing
    no-COOP requirement; updated the "MSAL Config" TypeScript snippet to include
    `postLogoutRedirectUri`.
  - **Did not touch** `docs/superpowers/specs/2026-08-12-entra-popup-login-design.md` — the
    historical root-cause document stating the PR #139 callback-bridge collision (not the COOP
    warning) caused the original regression. That correction remains binding and untouched, per
    instructions. `.wiki/deployment.md` now points to that file by path for the historical context
    instead of re-stating/duplicating it.

## Files Changed
- `src/services/MsalClient.ts` — added `postLogoutRedirectUri`; added `.catch()` to clear the
  cached singleton promise on `initialize()` rejection.
- `src/services/MsalClient.test.ts` — asserts `postLogoutRedirectUri`, adds a dedicated
  same-URI-for-both-fields test, adds the init-rejection/retry test, adds a
  `MockPublicClientApplicationConfig` type for the mock constructor's captured config (needed for
  `tsc --noEmit` cleanliness).
- `src/public/staticwebapp.config.json` — new Azure Static Web Apps route config (no-store,
  no-COOP, for `/entraid-redirect.html` only).
- `src/public/staticwebapp.config.test.ts` — new focused test verifying the exact config shape via
  a direct JSON import (`resolveJsonModule` is already enabled in `tsconfig.json`), avoiding a new
  `@types/node` dependency.
- `.wiki/deployment.md` — documents the real `staticwebapp.config.json`, no-store + no-COOP
  requirements, updated build-output tree, updated TODO checklist, updated manual-deploy step.
- `.wiki/authentication.md` — documents `postLogoutRedirectUri` reuse and the no-store requirement
  alongside no-COOP.

## Commit(s)
- `5b1f3a3` — `fix: harden MSAL v5 logout, retry, and bridge caching`
  (branch `rokolesnikov/fix-entra-popup-login`)

## Validation — exact commands and outcomes

| Command | Outcome |
|---|---|
| `npx vitest run src/services/MsalClient.test.ts` (RED, finding 1) | 2/3 tests failed for the expected reason (missing `postLogoutRedirectUri`) |
| `npx vitest run src/services/MsalClient.test.ts src/services/MsalAuthService.test.ts` (GREEN, finding 1) | 5 passed |
| `npx vitest run src/services/MsalClient.test.ts` (RED, finding 3) | 1 failed — raw `init failed` error propagated with no recovery |
| `npx vitest run src/services/MsalClient.test.ts src/services/MsalAuthService.test.ts` (GREEN, finding 3) | 5 passed |
| `npx vitest run src/public/staticwebapp.config.test.ts` (RED, finding 2) | 1 failed — `ENOENT` (config file missing) |
| `npx vitest run src/public/staticwebapp.config.test.ts` (GREEN, finding 2) | 1 passed |
| `npm test` (full suite) | **30/30 passed**, 6 test files, exit 0 |
| `npx eslint src/services/MsalClient.ts src/services/MsalClient.test.ts src/public/staticwebapp.config.test.ts` | Clean (0 problems) after `--fix` for CRLF-vs-prettier on the new test file |
| `npm run eslint` (repo-wide) | Exit 1 — pre-existing failures only, confirmed none in any changed file (`Select-String` for `MsalClient`/`staticwebapp` in the output found nothing) |
| `npm run stylelint` (repo-wide) | Exit 2 — pre-existing failures in `.scss` files; no `.scss` files were touched by this change |
| `npx tsc --noEmit` | Exit 0, clean |
| `npm run build` (`tsc && vite build`) | Exit 0; `✓ 4057 modules transformed`, `✓ built in 17.17s` |
| `Test-Path dist\entraid-redirect.html` | `True` |
| `Test-Path dist\staticwebapp.config.json` | `True` |
| `node -e "…JSON.parse(dist/staticwebapp.config.json)…"` | `{"route":"/entraid-redirect.html","headers":{"cache-control":"no-store"}}`, `has COOP: false` |
| `git --no-pager diff --check` | Exit 0 (only benign CRLF-normalization warnings, no whitespace errors) |
| `npm test` (post-commit re-run) | 30/30 passed again |

## Self-Review
- **Finding 1**: `postLogoutRedirectUri` uses the exact same `getEntraRedirectUri()` helper as
  `redirectUri`, so both are byte-identical and always derived from the current origin — matching
  the requirement that `logoutPopup()` target the same dedicated bridge. The lazy singleton
  (`msalInstancePromise`), account restoration, and authority-resolution logic are untouched.
- **Finding 3**: The `.catch()` only clears `msalInstancePromise` and rethrows; it does not swallow
  or alter the original error, so callers still see the exact rejection reason. Concurrent callers
  during a single in-flight (not-yet-settled) initialization still share the one promise/instance —
  verified by the pre-existing "initializes one client for concurrent callers" test still passing
  unmodified.
- **Finding 2**: The route is scoped to exactly `/entraid-redirect.html` (not a wildcard), carries
  only `cache-control: no-store`, and no COOP header — matching the requirement precisely. Placing
  the file in `src/public/` (Vite's `publicDir`) required no `vite.config.ts` changes since the
  directory is already configured; only the directory itself was newly created (it did not exist
  before, and no existing public assets were displaced — there were none to preserve).
- Chose to verify the emitted JSON via a source-of-truth unit test (importing the JSON file
  directly, typed via `resolveJsonModule`) rather than shelling out to `vite build` inside the test
  suite, keeping the test fast/deterministic while the full production build + `dist/` output
  checks were run separately as part of the validation checklist (see table above) — satisfying the
  "focused test or deterministic build assertion" requirement without adding slow build-in-test
  coupling.
- Confirmed the historical PR #139 root-cause correction
  (`docs/superpowers/specs/2026-08-12-entra-popup-login-design.md`) was left untouched; only added a
  path-reference to it from `.wiki/deployment.md` for context, without restating or altering its
  conclusions.

## Concerns
- Repo-wide `npm run eslint` and `npm run stylelint` still fail, but exclusively in files this task
  never touched (e.g., `src/App.tsx`, `src/globals.scss`) — consistent with the prior task-4 report
  in `.superpowers/sdd/task-4-report.md`, which already flagged these as pre-existing/out-of-scope.
  Recorded here rather than fixed, per instructions.
- `git diff --check` reports CRLF-normalization notices (not whitespace errors) on
  `.wiki/authentication.md` and `.wiki/deployment.md` — the repo appears to use CRLF line endings
  for these files already; Git will normalize on next touch per its own `core.autocrlf`/attributes
  handling. This did not affect the actual exit code (0) or content correctness.
- The production build emits a pre-existing (unrelated) "chunks are larger than 500 kB" warning for
  `dist/assets/main-*.js`; this is unrelated to this change and was not addressed, consistent with
  not fixing unrelated pre-existing issues.

---

## Follow-up Fix — Static Web App test location

### Status
Complete. Moved the `staticwebapp.config` test out of Vite's `publicDir` so the production build no longer copies it to `dist/staticwebapp.config.test.ts`.

### Commit
- `8491f1e` — `fix: move staticwebapp config test out of public dir`

### Validation
- `npx vitest run src/services/staticwebappConfig.test.ts` — pass
- `npm test` — pass
- `npx eslint src/services/staticwebappConfig.test.ts` — pass
- `npx tsc --noEmit` — pass
- `npm run build` — pass
- `Test-Path dist\staticwebapp.config.json` — `True`
- `Test-Path dist\staticwebapp.config.test.ts` — `False`
- `git diff --check` — pass

### Concerns
- `git diff --check` still prints CRLF-normalization warnings for `.wiki/deployment.md`, but exits 0 and reports no whitespace errors.
