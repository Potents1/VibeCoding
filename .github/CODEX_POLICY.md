# Codex Policy

This repository enforces Codex patch/review behavior through labels and path policy.

## Labels

- `codex:review`
  - Review-only mode.
  - No write/push actions are performed.

- `codex:patch`
  - Scoped write mode.
  - Only files inside allowed patch directories may be modified.

## Allowed patch directories

Configured in `.github/codex-policy.json` under `allowed_patch_dirs`.

Current defaults:

- `agentsystem/`
- `app/`
- `agent-dashboard/src/`
- `tests/`
- `.github/workflows/`

## Required checks before merge

Configured in `.github/codex-policy.json` under `required_checks_before_merge`.

Current defaults:

- `CI/CD Pipeline`
- `Fullstack CI`
- `E2E`

Apply these check names in branch protection rules for `main` (and optionally `develop`).
