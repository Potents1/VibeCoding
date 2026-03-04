# CI/CD Deployment Guide

This repository now uses separate workflows for CI, build, deploy, and rollback:

- `.github/workflows/ci.yml`
- `.github/workflows/ci_fullstack.yml`
- `.github/workflows/e2e.yml`
- `.github/workflows/build.yml`
- `.github/workflows/release.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/rollback.yml`
- `.github/workflows/pipeline_orchestrator.yml`

## Environment Strategy

- `develop` branch -> `dev` deployment target
- `main` branch -> `prod` deployment target (placeholder gate)

Production deploy is intentionally gated and requires provider-specific deployment steps.

## Dev Environment (this PC, separate folder)

Dev deploy is designed for a **self-hosted Windows runner on this machine**.

Default deploy path:

`C:\Users\peter\source\repos\AGI-dev`

Override options:

1. GitHub Environment variable `AGI_DEV_DEPLOY_PATH` (recommended)
2. `deploy.yml` manual input `deploy_path`

Health check URL default:

`http://127.0.0.1:5000/health`

Override with environment variable `AGI_DEV_HEALTH_URL` or rollback/deploy inputs.

## Required GitHub Environment Setup

Create environments in GitHub:

- `dev`
- `staging` (optional placeholder)
- `prod`

Recommended protection:

- Required reviewers for `prod`
- Deployment branch restrictions

## Self-hosted Runner Labels

The `deploy` and `rollback` jobs currently target:

`runs-on: [self-hosted, windows]`

If you want stricter routing, add a custom runner label (for example `agi-dev`) and update workflow labels.

## OIDC / Cloud Credentials

For production deployment, prefer OIDC-based short-lived credentials.

When you implement provider-specific prod deployment:

1. Add an OIDC trust relationship in your cloud provider.
2. Use provider login action in `deploy-prod-placeholder` job.
3. Avoid long-lived static cloud keys.

## Rollback

Use `Rollback` workflow (`workflow_dispatch`) for `dev`.

Rollback works by restoring previous release content under:

`<deploy-root>\releases\<release-id>` -> `<deploy-root>\current`

History markers:

- `<deploy-root>\meta\current_release.txt`
- `<deploy-root>\meta\release_history.log`

## Orchestrated pipeline

Use `Pipeline Orchestrator` for a single managed flow:

1. Fullstack CI
2. E2E
3. Optional Release
4. Optional Deploy

Automatic behavior:

- `push` to `develop` or `main` runs CI + E2E + Deploy.
- `pull_request` runs CI + E2E only.

Manual behavior (`workflow_dispatch`):

- Toggle `run_release`
- Toggle `run_deploy`
- Choose `deploy_environment`
- Optionally set `deploy_path`

## Artifact and Traceability

- `build.yml` produces versioned package artifacts.
- `deploy.yml` consumes build artifacts and uploads deployment artifacts/logs.
- `fullstackdeveloper-artifacts.yml` separately uploads `run_artifacts/**`.
