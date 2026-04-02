# AWS Cert Practice Design

## Purpose

AWS Cert Practice is an open-source study platform for AWS certification prep. It targets people preparing for foundational and associate-level AWS exams who want a free, transparent alternative to paid platforms. The project exists because no polished open-source option covers structured practice, guided learning, and spaced review together.

## V1 Scope

- **Target certifications:** CLF-C02, SAA-C03
- **Learn mode:** concept cards with recall-based reveal, inline practice questions, topic progression
- **Practice mode:** focused question drilling by domain/topic, immediate feedback, confidence tracking
- **Exam mode:** timed simulations at quick (20), medium (40), and full (65) question sizes
- **Review system:** flashcard review (spaced repetition) and question retry (re-attempt scheduling), tracked separately
- **Guest-first usage:** no login required for core study flows in v1

## Non-Goals

- No Cognito login in v1
- No full cross-device sync
- No AI-generated answers or tutoring at runtime
- No native mobile apps
- No support for all AWS certifications

## Architecture Summary

| Layer | Choice |
| --- | --- |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Rust Lambda behind API Gateway |
| Data | DynamoDB |
| Infrastructure | Terraform |
| Content pipeline | Repo source files -> validated schemas -> generated catalog |
| Client state | Zustand for session state; minimal browser storage for guest continuity only |
| Frontend hosting | S3 + CloudFront (static deployment) |

## Review Model

The review system provides two separate tracks:

- **Flashcard Review** -- concept cards resurface on a spaced-repetition schedule inspired by Anki. Users rate recall strength after revealing each card. Stronger recall pushes the next review further out; forgotten cards return quickly.
- **Question Retry** -- missed or low-confidence practice/exam questions are queued for re-attempt with simpler interval scheduling. Questions clear the queue when answered correctly with confidence.

These are intentionally separate models, not a single unified review queue.

## Codebase Structure

```
src/app/              -- pages and routes
src/components/ui/    -- shared UI primitives
src/components/study/ -- study-specific components
src/features/         -- domain logic (api, content, review, identity, sessions, progress)
src/types/            -- domain types
src/contracts/        -- API request/response shapes
src/schemas/          -- zod validation schemas
backend/rust-api/     -- Rust Lambda API
infra/terraform/      -- AWS infrastructure
content/              -- source questions and concept cards
```

## Key Constraints

- Keep the frontend statically deployable on S3 + CloudFront
- Keep the backend minimal and serverless
- Keep all API access behind a client layer -- no ad hoc fetches in components
- Keep content separate from user progress
- Keep contracts separate from domain types
- Keep guest flows working without Cognito

## Testing Strategy

- Keep the default verification bar for frontend changes at `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Use lightweight TypeScript tests for pure logic and content pipeline behavior, including schema validation and generated-catalog checks.
- Add component tests once the study UI has real interaction, focusing on question flow behavior rather than placeholder pages.
- Add a small end-to-end browser suite once seeded content and the first question flow exist.
- Keep backend and infrastructure verification in their native toolchains: `cargo test` / `cargo check` for Rust, and `terraform fmt` / `terraform validate` for infrastructure.

## Future Directions

- Cognito social login (Google, Apple)
- Authenticated cross-device sync
- Additional certifications
- AI-assisted review prioritization
