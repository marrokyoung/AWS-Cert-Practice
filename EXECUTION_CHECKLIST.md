# Sprint 1 Execution Checklist

## Goal

Build the first implementation baseline for a browser-first, guest-first AWS cert study app with:

- static frontend deployment on `S3 + CloudFront`
- serverless AWS backend foundation
- DynamoDB-backed data model and API contracts
- minimal client-side guest-session continuity only
- generated content catalog from repo source files
- initial app shell and home page
- one working question flow

## Current Baseline

- [x] Next.js scaffold exists
- [x] `pnpm` is in use
- [x] root `README.md` exists
- [x] root `DESIGN.md` exists
- [x] package name is `aws-cert-practice`

## Architecture Guardrails

- [ ] Do not treat browser storage as the primary persistence layer.
- [ ] Keep content loading separate from user progress storage.
- [ ] Keep Flashcard Review and Question Retry as separate models and flows.
- [ ] Provision the AWS backend foundation in Sprint 1, but keep guest study flows usable without login.
- [ ] Do not add Cognito-backed user flows in Sprint 1.
- [ ] Keep the frontend deployable as a static site on `S3 + CloudFront`.
- [ ] Keep public AWS endpoints behind rate limits, cost controls, and least-privilege IAM.
- [ ] Keep all frontend-to-backend traffic behind a small API client layer. No ad hoc fetch logic scattered across UI components.

## Branch Workflow

- [ ] Create a fresh branch from `main` for one discrete checklist step.
- [ ] Finish the branch completely before opening the next one.
- [ ] Merge only when the step meets its acceptance criteria.
- [ ] Keep each branch small enough to review quickly.

Recommended naming pattern:

- `chore/...` for setup
- `feat/...` for app features
- `infra/...` for Terraform or AWS resources
- `backend/...` for Rust Lambda work
- `fix/...` for general error fixes

## Execution Order

### 1. Repo And Dependency Baseline

- [ ] Remove or replace remaining default Next.js scaffold content that is no longer useful.
- [ ] Ensure local tooling exists for:
  - `pnpm`
  - Rust / `cargo`
  - Terraform
- [ ] Add the first required app dependencies:
  - `zustand`
  - `zod`
  - `shadcn`/ui dependencies as needed
- [ ] Add any required scripts to `package.json`:
  - `content:build`
  - `lint`
  - `build`
  - `typecheck`
  - optional local backend/dev helper scripts if needed

### 2. Folder Structure

- [ ] Create `src/app/[cert]/practice/`
- [ ] Create `src/app/review/`
- [ ] Create `src/app/progress/`
- [ ] Create `src/components/`
- [ ] Create `src/features/api/`
- [ ] Create `src/features/content/`
- [ ] Create `src/features/review/`
- [ ] Create `src/features/session/`
- [ ] Create `src/features/sessions/`
- [ ] Create `src/features/progress/`
- [ ] Create `src/features/exams/`
- [ ] Create `src/generated/`
- [ ] Create `src/types/`
- [ ] Create `backend/rust-api/`
- [ ] Create `infra/terraform/`
- [ ] Create `content/CLF-C02/`
- [ ] Create `content/SAA-C03/`
- [ ] Create `scripts/`

### 3. Core Type Definitions

- [ ] Add `src/types/question.ts`
- [ ] Add `src/types/concept.ts`
- [ ] Add `src/types/review.ts`
- [ ] Add `src/types/progress.ts`
- [ ] Add frontend/backend shared contract types where appropriate.
- [ ] Define shared enums or unions for:
  - certifications
  - domains
  - question types
  - flashcard review states
  - question retry states
- [ ] Add `zod` schemas for source content validation.

### 4. Content Pipeline

- [ ] Decide and document the exact source format for:
  - questions
  - concept cards
- [ ] Add `scripts/build-content.ts`.
- [ ] Implement source validation before catalog generation.
- [ ] Generate `src/generated/content-catalog.ts` from repo content.
- [ ] Ensure generated content can be safely imported by the web app.
- [ ] Keep raw source content out of Client Components.
- [ ] Make `content:build` repeatable and deterministic.

### 5. Backend Foundation

- [ ] Create the Rust API project under `backend/rust-api/`.
- [ ] Define initial shared API contracts for:
  - health
  - version
  - future config/bootstrap data
  - guest-session bootstrap
- [ ] Add a consistent error type and response format for the API.
- [ ] Define DynamoDB table names and ownership boundaries.
- [ ] Keep authenticated user endpoints out of Sprint 1.
- [ ] Keep the backend small and serverless-first.

### 6. Infrastructure Foundation

- [ ] Add Terraform root structure under `infra/terraform/`.
- [ ] Define frontend resources:
  - S3 bucket
  - CloudFront distribution
  - OAC
- [ ] Define backend resources:
  - API Gateway
  - Lambda function
  - DynamoDB tables
- [ ] Define IAM roles and policies with least privilege.
- [ ] Add safety controls:
  - API throttling
  - WAF or rate-based protections
  - Lambda reserved concurrency
  - billing/budget alarms
  - CloudWatch alarms
- [ ] Ensure `terraform fmt` and `terraform validate` are part of the workflow.

### 7. Frontend API And Guest Session Foundation

- [ ] Add `src/features/api/client.ts`.
- [ ] Add `src/features/session/guest-session.ts`.
- [ ] Define how a guest session is created and resumed in the client.
- [ ] Limit browser-side persistence to the minimum needed for guest continuity and UI preferences.
- [ ] Keep durable domain assumptions out of the browser persistence layer.
- [ ] Make it possible to swap guest-only flows for Cognito-backed flows later without rewriting the UI tree.

### 8. UI Foundation

- [ ] Wire up the chosen fonts:
  - `Space Grotesk`
  - `IBM Plex Sans`
  - `IBM Plex Mono`
- [ ] Add color, spacing, radius, border, and shadow tokens to `globals.css`.
- [ ] Build the main app shell.
- [ ] Add top-level navigation placeholders for:
  - cert selection
  - Review
  - Progress
  - Settings
- [ ] Build `src/components/study-card-shell.tsx`.
- [ ] Keep the shell compatible with first-run and returning-user states.

### 9. Home Page Baseline

- [ ] Implement first-run state:
  - cert selection
  - `Start Learning` primary CTA
- [ ] Implement returning-user placeholder states:
  - `Review Due Items`
  - `Resume Session`
- [ ] Show static placeholder summaries for:
  - due review
  - weak areas
  - recent progress
- [ ] Keep the home page usable without Cognito login.

### 10. Question Flow Baseline

- [ ] Add `src/components/question-card.tsx`.
- [ ] Load seeded question data from the generated content catalog.
- [ ] Render question stem and answer options.
- [ ] Support answer submission.
- [ ] Show correctness state.
- [ ] Show explanation and distractor explanations.
- [ ] Capture confidence selection.
- [ ] Route question-result persistence through a dedicated app boundary, not directly through UI components.
- [ ] Ensure missed or low-confidence results can be handed off to Question Retry later.

### 11. Seed Content

- [ ] Add at least one domain folder per cert.
- [ ] Seed a minimum of `5` usable questions per cert to unblock UI development.
- [ ] Stretch goal: reach `10-15` questions per cert during Sprint 1.
- [ ] Ensure each seeded question includes:
  - valid IDs
  - explanation
  - distractor explanations
  - AWS source URLs
  - tags

### 12. Initial Review And Session Boundaries

- [ ] Create file/module placeholders for:
  - `flashcard-scheduler.ts`
  - `question-retry.ts`
  - `learn-session.ts`
  - `practice-session.ts`
  - `progress-tracker.ts`
- [ ] Do not fully implement Review yet, but define the interfaces now.
- [ ] Keep Flashcard Review and Question Retry separate even if one is only a stub in Sprint 1.

## Acceptance Criteria

- [ ] `pnpm lint` passes.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm build` passes.
- [ ] `cargo check` passes for the Rust API foundation.
- [ ] `terraform fmt` and `terraform validate` pass.
- [ ] The app runs locally with `pnpm dev`.
- [ ] The home page reflects the intended first-run structure.
- [ ] A practice page can load seeded content from the generated catalog.
- [ ] A question can be answered and reviewed in the UI.
- [ ] Frontend API access is isolated to `src/features/api/`.
- [ ] Guest-session handling is isolated to `src/features/session/`.
- [ ] The frontend remains compatible with static deployment on `S3 + CloudFront`.
- [ ] Backend infra exists as code for API Gateway, Lambda, DynamoDB, and baseline safety controls.
- [ ] Guest study flows do not require Cognito.

## Explicitly Out Of Scope For Sprint 1

- [ ] Cognito login flow
- [ ] Authenticated cloud progress sync
- [ ] Merging guest progress into authenticated cloud accounts
- [ ] AI-assisted review recommendations
- [ ] Full Review page implementation
- [ ] Full Exam mode
- [ ] Offline-first local cache strategy beyond minimal guest continuity
- [ ] Full production rollout, custom domain setup, and polished release automation

## Recommended Branch Sequence

1. `chore/foundation-tooling`
Create folders, confirm `pnpm`/Rust/Terraform, add frontend dependencies, add scripts.

2. `feat/content-catalog-foundation`
Define source schemas and generate the initial content catalog.

3. `backend/rust-api-skeleton`
Create the Lambda project, basic handlers, shared error format, and guest-session/bootstrap contracts.

4. `infra/aws-foundation`
Add Terraform for `S3 + CloudFront`, API Gateway, Lambda, DynamoDB, IAM, and baseline safety controls.

5. `feat/frontend-api-and-session`
Add the API client layer and minimal guest-session continuity handling.

6. `feat/ui-shell-and-home`
Build the app shell, fonts, tokens, and home page first-run/returning states.

7. `feat/practice-question-flow`
Build the first real question card flow against seeded content.

8. `feat/review-boundaries`
Add review/session module boundaries and stubs without fully implementing review yet.
