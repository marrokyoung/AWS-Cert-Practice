# Sprint 1 Execution Checklist

## Goal

Deliver a working Sprint 1 baseline: static frontend, serverless backend, content pipeline, app shell, and one question flow.

See [DESIGN.md](./DESIGN.md) for architecture and constraints.

## Current Status

- Completed: Steps `1-9`
- Next step: `10. Question Flow Baseline`
- Next branch: `my/practice-question-flow`

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

- [x] Add Terraform root structure under `infra/terraform/`.
- [x] Define frontend resources:
  - S3 bucket
  - CloudFront distribution
  - OAC
- [x] Define backend resources:
  - API Gateway
  - Lambda function
  - DynamoDB tables
- [x] Define IAM roles and policies with least privilege.
- [x] Add safety controls:
  - API throttling
  - WAF or rate-based protections
  - Lambda reserved concurrency
  - billing/budget alarms
  - CloudWatch alarms
- [x] Ensure `terraform fmt` and `terraform validate` are part of the workflow.

Step gate:

- [x] `terraform fmt -check -recursive`
- [x] `terraform validate`

### 6. Frontend API And Guest Session Foundation

Branch: `my/frontend-api-session-foundation`

Step goal: implement the frontend API boundary and the existing guest-session placeholder without leaking fetch/storage logic into UI components.

- [x] Pre-flight:
  - Confirm the working branch is `my/frontend-api-session-foundation`.
  - Keep this step limited to API client, guest-session continuity, and the minimum app bootstrap wiring needed to initialize that session.
  - Do not pull Step 7 shell/UI work or Step 8 home-page behavior into this branch except the smallest provider wiring required for initialization.
  - Treat `src/contracts/api.ts` as the source of truth for frontend request/response shapes.
- [x] Resolve the API module path deliberately:
  - Add `src/features/api/client.ts` as the concrete implementation file.
  - Keep `src/features/api/index.ts` only as a barrel re-export so existing folder imports stay stable.
  - Keep all backend fetch logic inside `src/features/api/`; do not split ad hoc helpers across unrelated directories.
- [x] Add build-time environment configuration for the static frontend:
  - Add `.env.example` documenting `NEXT_PUBLIC_API_BASE_URL`.
  - Treat the API base URL as required for deployed builds; do not hardcode the API Gateway URL in source files.
  - Normalize exactly one trailing-slash edge in the client so callers do not care whether the env var ends with `/`.
  - For local development, document using `.env.local` pointed at the deployed dev API until a local backend runner exists.
- [x] Implement the API client surface in `src/features/api/client.ts`:
  - `getHealth()` -> `GET /health`
  - `getVersion()` -> `GET /version`
  - `getConfig()` -> `GET /config`
  - `createGuestSession(request)` -> `POST /guest-sessions`
  - one shared JSON fetch wrapper that joins paths, parses JSON, and converts non-2xx responses into one typed client-side error shape aligned with `ApiError`
  - send `Content-Type: application/json` only when a request body exists
  - use `credentials: "omit"` and no auth headers in Sprint 1
- [x] Keep the API boundary simple and predictable:
  - Return typed contract data only on success.
  - Surface missing `NEXT_PUBLIC_API_BASE_URL` and network failures as stable client-side errors instead of silent fallbacks.
  - Do not add retries, caching, SWR-like abstractions, or proxy routes in this step.
  - Implement `getHealth()`, `getVersion()`, and `getConfig()`, but do not make them hard prerequisites for initial page render.
- [x] Add the guest-session persistence schema in `src/features/identity/guest-session.ts`:
  - Use a single localStorage key: `aws-cert-practice.clientId.v1`.
  - Persist only `clientId` in localStorage; `sessionId` and `expiresAt` live only in memory (Zustand store).
  - Keep the schema versioned and isolated from future review/progress data.
  - Do not store session tokens, question state, review state, progress summaries, or content data in browser storage.
- [x] Define the `clientId` strategy explicitly:
  - Generate a stable anonymous `clientId` with `crypto.randomUUID()` on the client if one is missing.
  - Reuse that `clientId` across guest-session renewals in the same browser.
  - Treat it as an opaque identifier only; do not add fingerprinting, analytics, or cross-device assumptions.
- [x] Implement guest-session lifecycle helpers in `src/features/identity/guest-session.ts`:
  - read the stored clientId
  - resolve or generate a stable clientId via `crypto.randomUUID()`
  - always mint a fresh session via `POST /guest-sessions` on app boot (sessionId never stored locally)
  - persist only the clientId on first visit
  - expose one high-level `bootstrapGuestSession()` function that app bootstrap code can call
  - keep the orchestration in plain TypeScript functions so it can be tested without a DOM-specific test runner
- [x] Add the session state store in `src/features/identity/store.ts`:
  - use Zustand because `DESIGN.md` already calls for it
  - keep only `clientId`, `sessionId`, `expiresAt`, `status`, `error`, and `isInitialized`
  - do not put content catalog data, progress data, review data, or API response caches into this store
  - do not use Zustand persistence middleware in this step; keep persistence explicit in `guest-session.ts`
- [x] Add the app bootstrap boundary explicitly:
  - Add `src/features/identity/session-provider.tsx` as the only component that triggers guest-session initialization.
  - Add `src/app/providers.tsx` as the top-level client provider entry.
  - Wrap the root layout with that provider while keeping `src/app/layout.tsx` as a server component.
  - Initialize in this order: load stored `clientId` -> resolve or generate `clientId` -> mint fresh session via API -> hydrate the store.
- [x] Keep config/bootstrap scope deliberately small:
  - Implement `getConfig()` now because the backend contract already exists.
  - Do not block guest-session initialization on `GET /config`.
  - Do not add a broader config/bootstrap store until a later step genuinely consumes that data.
- [x] Define session-renewal and degraded-mode behavior deliberately:
  - Always mint a fresh session on boot; no local expiry check needed since sessionId is never stored.
  - If session creation fails, keep static content routes usable and mark the identity store as errored instead of crashing the tree.
  - Do not add background refresh, polling, offline mutation queues, or recovery prompts in this step.
- [x] Keep client/server boundaries explicit:
  - `src/features/api/client.ts` must not touch `window`, `localStorage`, or other browser-only APIs.
  - `src/features/identity/*` may use browser APIs, but only behind client-only entry points.
  - Keep `src/app/layout.tsx` free of direct localStorage access and session bootstrap side effects.
  - Content continues to come from the generated catalog, not from the API.
- [x] Keep future Cognito replacement possible:
  - UI components should read identity/session state through the store or a tiny exported hook, not raw localStorage.
  - Keep guest-session naming contained to `src/features/identity/`; do not leak it into general UI component APIs.
  - Avoid assumptions that guest identity is the final long-term model.
- [x] Add the minimum tests that protect the boundary:
  - API client success and error handling tests with mocked `fetch`
  - guest-session clientId storage and resolution tests
  - session bootstrap tests covering fresh mint, clientId persistence, and API failure paths
  - if the current `pnpm test` script only targets one file, expand it so the new frontend tests actually run

Do not merge this step if:

- [x] UI components call `fetch` directly for backend requests.
- [x] Guest identity uses more than one localStorage key without a documented reason.
- [x] The deployed API URL is hardcoded in source files instead of flowing through `NEXT_PUBLIC_API_BASE_URL`.
- [x] Guest-session bootstrap failure prevents static content routes from rendering.
- [x] The branch introduces Cognito, authenticated-user flows, progress persistence, or review persistence.

Step gate:

- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm test`
- [x] `pnpm build` with `NEXT_PUBLIC_API_BASE_URL` set

### 7. UI Foundation

Branch: `my/ui-shell-foundation`

Step goal: build the app shell and design tokens without coupling the layout to unfinished backend work.

- [x] Wire up the chosen fonts:
  - `Space Grotesk`
  - `IBM Plex Sans`
  - `IBM Plex Mono`
- [x] Add app font, color, radius, border, and semantic UI tokens to `globals.css`.
- [x] Build the main app shell.
- [x] Add top-level navigation placeholders for:
  - cert selection
  - Review
  - Progress
  - Settings
- [x] Build `src/components/study/study-card-shell.tsx`.
- [x] Keep the shell compatible with first-run and returning-user states.

Known limitations and future considerations:

- The header uses a single horizontal row with non-shrinking items. On narrow mobile viewports, long cert labels (e.g. "Solutions Architect Associate") can crowd the header. A follow-up responsiveness pass should choose a real mobile nav pattern (compact labels, second-row nav, disclosure menu, or drawer).
- `AppShell` is a server component; only `AppHeaderClient` (nav links, cert selector, active state) hydrates on the client.
- The cert pages use a shared `CertPageHeader` component from `src/components/study/cert-page-header.tsx`.

Step gate:

- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`

### 8. Home Page Baseline

Branch: `my/home-baseline`

Step goal: make the home page useful for first-run and returning-user placeholder states before real progress data exists.

- [x] Implement first-run state:
  - cert selection
  - `Start Learning` primary CTA
- [x] Implement returning-user placeholder states:
  - `Review Due Items`
  - `Resume Session`
- [x] Show static placeholder summaries for:
  - due review
  - weak areas
  - recent progress
- [x] Keep the home page usable without Cognito login.

Step gate:

- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`

### 9. Seed Content

Branch: `my/seed-sprint1-baseline`

Step goal: add the minimum real SAA-C03 question content needed to exercise the generated catalog and unblock Step 10 question-flow work.

- [x] Pre-flight:
  - Keep this branch content-only. Do not change UI, question-flow behavior, backend code, or infrastructure unless a tiny content-pipeline fix is required to admit valid seed files.
  - Keep Step 9 question-only; do not add concept cards in this branch.
  - Focus this step on `SAA-C03` only. Defer `CLF-C02` seed content to a later branch.
  - Treat `content/README.md` and `src/schemas/question.schema.ts` as the source of truth for file format and validation.
- [x] Lock the starter domain:
  - `content/SAA-C03/domains/secure-architectures/questions/`
- [x] Seed exactly `10` usable questions in the starter domain.
- [x] Keep the seed set intentionally simple:
  - every seeded question must use `status: "ready"`
  - every seeded question must use `type: "multiple-choice"`
  - every seeded question must have exactly `4` options
  - every seeded question must have exactly `1` correct answer
  - prefer foundational/intermediate topics over advanced edge cases
  - cover at least `5` distinct topics in the domain; do not create near-duplicate question variants
- [x] Ensure each seeded question includes:
  - valid `id`
  - `cert` and `domain` matching the folder path
  - `topic`
  - `difficulty`
  - `stem`
  - `options`
  - `correctAnswers`
  - `explanation`
  - `distractorExplanations` for every incorrect option
  - `awsSourceUrls`
  - `examVersion` matching the cert
  - `tags`
  - `status: "ready"`
- [x] Keep source quality explicit:
  - use only public AWS documentation URLs allowed by the existing schema
  - write explanations and distractor explanations in repo-authored wording; do not copy exam-dump material
  - keep explanations specific enough that Step 10 UI can show meaningful review feedback
- [x] Keep path and file structure canonical:
  - one JSON object per file
  - filename must equal `id`
  - place files only under the canonical `questions/` folder for the seeded domain

Do not merge this step if:

- [ ] Any seeded question is still `draft`.
- [ ] Any seeded question uses `multiple-select`.
- [ ] Concept cards are added as part of this branch.
- [ ] The branch changes UI, question-flow behavior, or content-pipeline behavior beyond the smallest fix required to accept valid question files.
- [ ] The generated catalog does not include exactly `10` total seeded questions, all under `SAA-C03`.

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
- [ ] If a cert has no seeded questions yet, render a stable empty state instead of a broken or misleading practice flow.
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
