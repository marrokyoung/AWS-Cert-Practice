# Sprint 1 Execution Checklist

## Goal

Deliver a working Sprint 1 baseline: static frontend, serverless backend, content pipeline, app shell, and one question flow.

See [DESIGN.md](./DESIGN.md) for architecture and constraints.

## Current Status

- Completed: Steps `1-4`
- Next step: `5. Infrastructure Foundation`
- Next branch: `my/aws-foundation`

## Delivery Guardrails

- Keep exactly one checklist step per branch.
- Keep each branch mergeable on its own; if a prerequisite is missing, add only the smallest missing piece.
- Prefer contract-first and placeholder-first implementations over premature abstractions.
- Do not start the next branch until the current branch passes its step gate.
- If a branch changes shared contracts, schemas, or generated files, rerun the affected frontend and backend checks even if the change looks isolated.
- Keep authenticated flows, production polish, and non-Sprint-1 extras out of scope unless the current step explicitly requires them.
- When in doubt, choose the simpler implementation that preserves the existing boundaries in [DESIGN.md](./DESIGN.md).

## Execution Order

### 1. Repo And Dependency Baseline

Branch: `my/foundation-tooling`

- [x] Remove or replace remaining default Next.js scaffold content that is no longer useful.
- [x] Ensure local tooling exists for:
  - `pnpm`
  - Rust / `cargo`
  - Terraform
- [x] Add the first required app dependencies:
  - `zustand`
  - `zod`
  - `shadcn`/ui dependencies as needed
- [x] Add any required scripts to `package.json`:
  - `content:build`
  - `lint`
  - `build`
  - `typecheck`
  - optional local backend/dev helper scripts if needed

### 2. Route, Type, And Contract Foundation

Branch: `my/route-type-contract-foundation`

- [x] Create route structure with placeholder `page.tsx` files:
  - `src/app/[cert]/learn/page.tsx`
  - `src/app/[cert]/practice/page.tsx`
  - `src/app/[cert]/exam/page.tsx`
  - `src/app/review/page.tsx`
  - `src/app/progress/page.tsx`
- [x] Add `src/types/question.ts`
- [x] Add `src/types/concept.ts`
- [x] Add `src/types/review.ts`
- [x] Add `src/types/progress.ts`
- [x] Add `src/contracts/api.ts` for API request/response shapes the frontend consumes.
- [x] Define shared enums or unions for:
  - certifications
  - domains
  - question types
  - flashcard review states
  - question retry states
- [x] Add `zod` schemas for source content validation.
- [x] Create `content/CLF-C02/` and `content/SAA-C03/` with a schema README or example file.
- [x] Create `src/features/identity/` for guest-session continuity.
- [x] Create `src/components/study/` directory.

### 3. Content Pipeline

Branch: `my/content-pipeline`

- [x] Decide and document the exact source format for:
  - questions
  - concept cards
- [x] Add `scripts/build-content.ts`.
- [x] Implement source validation before catalog generation.
- [x] Generate `src/generated/content-catalog.ts` from repo content.
- [x] Ensure generated content can be safely imported by the web app.
- [x] Keep raw source content out of Client Components.
- [x] Make `content:build` repeatable and deterministic.

### 4. Backend Foundation

Branch: `my/backend-foundation`

Step goal: add the smallest useful Rust Lambda foundation that matches the existing TypeScript contracts.

- [x] Pre-flight:
  - Confirm the working branch is `my/backend-foundation`.
  - Treat `src/contracts/api.ts` as the frontend source of truth for request/response shapes.
  - If the Rust API needs a new contract, add or update the TypeScript contract first in the same branch.
  - Do not pull Step 5 infrastructure work or Step 6 frontend client work into this branch unless a tiny contract fix is required.
- [x] Lock the Sprint 1 scope before coding:
  - Include only `health`, `version`, one minimal config/bootstrap shape, and `guest-session bootstrap`.
  - Exclude Cognito, authenticated-user flows, review scheduling, progress sync, exam persistence, and admin endpoints.
  - Prefer placeholder-first behavior over speculative abstractions.
- [x] Create the Rust API project under `backend/rust-api/`.
- [x] Keep the Rust project intentionally small:
  - Use only the minimum runtime, HTTP, serialization, and error-handling dependencies needed for Lambda.
  - Prefer a small route dispatcher over a heavy web framework.
  - Avoid repository layers, service containers, or generic abstractions unless the compiler forces a clear need.
- [x] Define the initial endpoint surface explicitly:
  - `GET /health`
  - `GET /version`
  - one config/bootstrap endpoint with a single stable path chosen now and reused later
  - `POST /guest-sessions`
- [x] Mirror the existing TypeScript contracts in Rust for:
  - `HealthResponse`
  - `VersionResponse`
  - `GuestSessionBootstrapRequest`
  - `GuestSessionBootstrapResponse`
  - `ApiError`
- [x] Fill the current contract gap for future config/bootstrap data:
  - Add the missing TypeScript contract in `src/contracts/api.ts` before implementing the Rust type.
  - Keep that response minimal and static-safe; include only fields the frontend will genuinely need to bootstrap later.
  - Do not move content catalog data, progress summaries, or auth state into bootstrap.
- [x] Keep wire behavior exact and predictable:
  - Return JSON only.
  - Keep field names identical between TypeScript and Rust.
  - Use ISO-8601 timestamps for all time fields.
  - Keep response envelopes shallow; avoid unnecessary nesting.
- [x] Add one consistent API error envelope:
  - `code`
  - `message`
  - optional `details`
  - Map internal failures to sanitized client responses.
- [x] Decide guest-session bootstrap behavior deliberately:
  - If persistence is not required yet, keep the handler placeholder-only and document that choice.
  - If persistence is required now, write only the minimum guest-session record needed for resume continuity.
  - Do not couple guest-session bootstrap to progress, review, or authenticated identity.
- [x] Define DynamoDB table naming and ownership boundaries before any data access code:
  - Use environment-safe names or a documented naming convention, not ad hoc literals scattered through handlers.
  - Keep guest sessions separate from future progress/review data.
  - Document which endpoint owns which table and which data does not belong in that table.
- [x] Add the minimum tests that protect the contract boundary:
  - route smoke tests for each implemented endpoint
  - serialization tests for success payloads
  - request validation tests for `POST /guest-sessions`
  - error-response tests for invalid input and unknown routes
- [x] Keep authenticated user endpoints out of Sprint 1.
- [x] Keep the backend small and serverless-first.

Do not merge this step if:

- [x] Any Rust response shape no longer matches `src/contracts/api.ts`.
- [x] The branch introduces Cognito, user accounts, or durable progress models.
- [x] The guest-session path leaks progress or review concerns into the session model.
- [x] The API requires infrastructure changes beyond what Step 5 is meant to add.
- [x] The backend foundation cannot be explained as four small endpoints plus shared error handling.

Step gate:

- [x] `cargo fmt`
- [x] `cargo fmt --check`
- [x] `cargo test`
- [x] `cargo check`
- [x] `pnpm typecheck`
- [x] `pnpm test`

### 5. Infrastructure Foundation

Branch: `my/aws-foundation`

Step goal: add the minimum Terraform baseline needed for the static frontend, serverless API, and core safety controls.

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

Step gate:

- [ ] `terraform fmt -check -recursive`
- [ ] `terraform validate`

### 6. Frontend API And Guest Session Foundation

Branch: `my/frontend-api-session-foundation`

Step goal: implement the frontend API boundary and the existing guest-session placeholder without leaking fetch/storage logic into UI components.

- [ ] Add `src/features/api/client.ts`.
- [ ] Implement `src/features/identity/guest-session.ts`.
- [ ] Define how a guest session is created and resumed in the client.
- [ ] Limit browser-side persistence to the minimum needed for guest continuity and UI preferences.
- [ ] Keep durable domain assumptions out of the browser persistence layer.
- [ ] Make it possible to swap guest-only flows for Cognito-backed flows later without rewriting the UI tree.

Step gate:

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`

### 7. UI Foundation

Branch: `my/ui-shell-foundation`

Step goal: build the app shell and design tokens without coupling the layout to unfinished backend work.

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
- [ ] Build `src/components/study/study-card-shell.tsx`.
- [ ] Keep the shell compatible with first-run and returning-user states.

Step gate:

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`

### 8. Home Page Baseline

Branch: `my/home-baseline`

Step goal: make the home page useful for first-run and returning-user placeholder states before real progress data exists.

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

Step gate:

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`

### 9. Seed Content

Branch: `my/seed-sprint1-baseline`

Step goal: add the minimum real content needed to exercise the generated catalog and unblock UI work.

- [ ] Add at least one domain folder per cert.
- [ ] Seed a minimum of `5` usable questions per cert to unblock UI development.
- [ ] Stretch goal: reach `10-15` questions per cert during Sprint 1.
- [ ] Ensure each seeded question includes:
  - valid IDs
  - explanation
  - distractor explanations
  - AWS source URLs
  - tags

Step gate:

- [ ] `pnpm content:build`
- [ ] `pnpm test`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`

### 10. Question Flow Baseline

Branch: `my/practice-question-flow`

Step goal: implement one clean practice-question loop against the generated catalog, with persistence routed through an app boundary.

- [ ] Add `src/components/study/question-card.tsx`.
- [ ] Load seeded question data from the generated content catalog.
- [ ] Render question stem and answer options.
- [ ] Support answer submission.
- [ ] Show correctness state.
- [ ] Show explanation and distractor explanations.
- [ ] Capture confidence selection.
- [ ] Route question-result persistence through a dedicated app boundary, not directly through UI components.
- [ ] Ensure missed or low-confidence results can be handed off to Question Retry later.

Step gate:

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`

### 11. Initial Review And Session Boundaries

Branch: `my/review-session-boundaries`

Step goal: define the review/session seams now without prematurely building the full Review experience.

- [ ] Create file/module placeholders for:
  - `flashcard-scheduler.ts`
  - `question-retry.ts`
  - `learn-session.ts`
  - `practice-session.ts`
  - `progress-tracker.ts`
- [ ] Do not fully implement Review yet, but define the interfaces now.
- [ ] Keep Flashcard Review and Question Retry separate even if one is only a stub in Sprint 1.

Step gate:

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`

## Acceptance Criteria

- [ ] `pnpm lint` passes.
- [ ] `pnpm test` passes.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm build` passes.
- [ ] `cargo test` passes for the Rust API foundation.
- [ ] `cargo check` passes for the Rust API foundation.
- [ ] `terraform fmt` and `terraform validate` pass.
- [ ] The app runs locally with `pnpm dev`.
- [ ] The home page reflects the intended first-run structure.
- [ ] A practice page can load seeded content from the generated catalog.
- [ ] A question can be answered and reviewed in the UI.
- [ ] Frontend API access is isolated to `src/features/api/`.
- [ ] Guest-session handling is isolated to `src/features/identity/`.
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
