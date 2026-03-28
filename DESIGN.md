# AWS Cert Practice App Design Doc

## Status

- Version: v1
- Date Last Updated: 2026-03-27
- Scope: Initial product and implementation plan

## Overview

AWS Cert Practice App is an open-source study platform for AWS certification prep. The initial release targets:

- AWS Certified Cloud Practitioner (`CLF-C02`)
- AWS Certified Solutions Architect - Associate (`SAA-C03`)

The product goal is to offer a free, transparent, community-driven alternative to paid certification platforms, while staying clearly separate from exam-dump territory. All learning content should be based on public AWS documentation and original explanations.

V1 should be treated as a browser-first web app, with PWA/offline support as a product goal. The frontend should stay statically deployable, while durable application data is designed around AWS-backed services. Any browser-side persistence should stay minimal and should not be treated as the primary source of truth.

## Problem Statement

There is no polished open-source AWS certification practice app with:

- structured practice questions
- guided learning content
- realistic exam simulations
- review workflows for weak areas
- a contribution model that supports long-term content growth

Existing open-source options are generally static notes, abandoned apps, or collections of links. Commercial tools dominate this space, but they are closed-source and paid.

## Product Goals

- Provide a solid OSS study experience for `CLF-C02` and `SAA-C03`
- Support multiple study styles: guided learning, focused practice, and exam simulation
- Keep the app usable without paid infrastructure
- Make question/content contributions easy to review through GitHub
- Track weak areas and missed questions to improve retention over time
- Build a foundation that can later support more certs and optional sync

## Non-Goals For v1

- Full cross-device sync
- Social or competitive features
- AI-generated answers at runtime
- Support for every AWS certification
- Rich instructor/course content
- Native mobile apps
- Multi-user local profile switching on a shared machine

## Core Principles

- Local-first by default
- Persistence should sit behind abstractions so storage can evolve without rewriting study flows
- Keep the frontend static-hostable and keep the backend minimal and serverless
- Prefer core AWS primitives over higher-level platform abstractions
- OSS-friendly content pipeline
- Clear citations to official AWS documentation
- Immediate explanations, not just scoring
- Community extensibility without compromising content quality

## Architecture Summary

### Tech Stack

| Layer | Choice | Reason |
| --- | --- | --- |
| Framework | Next.js 14+ (App Router) | Familiar stack, routing, SSR/SSG support, API routes available |
| Language | TypeScript | Strong schemas and safer content loading |
| Backend language | Rust | Strong fit for a small serverless API on AWS Lambda |
| Styling | Tailwind CSS + shadcn/ui | Fast UI delivery with accessible primitives |
| Client session persistence | Minimal browser-side session storage | Supports guest continuity without making browser storage the primary data model |
| API layer | API Gateway + Rust Lambda | Minimal serverless backend foundation that can grow over time |
| Cloud data store | DynamoDB | Cheap serverless store for guest and future authenticated progress/review data |
| Auth | Cognito later | Planned future auth path for Google and Apple login |
| Client state | Zustand | Lightweight session state management |
| Content format | Markdown + JSON source files in repo, compiled into a generated content catalog | Easy PR review with a browser-safe loading path |
| Frontend deployment | S3 + CloudFront | Static frontend hosting on core AWS services |
| Infrastructure as code | Terraform | Reproducible AWS setup with explicit safeguards and deployment control |
| Package manager | pnpm | Fast and common for modern TS apps |

### Client Session Persistence In v1

- browser-side persistence should be limited to minimal guest-session continuity, UI preferences, and temporary cache
- durable study data should be modeled so it can live in DynamoDB-backed services rather than being anchored to browser storage
- offline or cached behavior can still exist, but it should be treated as a convenience layer, not the system of record
- clearing browser data may still break guest continuity before Cognito or account recovery exists

### V1 User Model

- users can open the app directly in the browser without creating an account
- supported browsers may also allow the app to be installed as a PWA on desktop or mobile
- first use may create an anonymous guest session through the backend
- the client may retain a guest session identifier locally for continuity between visits
- v1 does not require login for core study flows
- guest users should still be able to study even if authenticated cloud persistence is not available yet
- future login should use Cognito with social sign-in providers such as Google and Apple

### Content Loading Strategy

- source content lives in the repo under `content/`
- CI and local scripts validate all source files before they are used by the app
- a build step compiles content into a generated catalog that is safe to import in the web app
- app pages import from the generated catalog at build time, not from raw browser-side filesystem access
- Client Components receive only the content slices they need for the active screen or session
- offline support should cache the app shell and the content already accessed by the user, with room to add per-cert download packs later

### Data Versioning And Integrity

- generated content should carry a `contentVersion` value so guest or authenticated progress can be reconciled against updated source material
- question IDs and concept-card IDs must stay stable across content edits whenever possible
- if content is removed or renamed, affected review records should be cleaned up, migrated, or marked inactive
- API payloads and DynamoDB items should use versioned schemas where appropriate

### Backend Foundation In v1

- the AWS backend should be provisioned in v1 even though login and authenticated sync are deferred
- API Gateway and Rust Lambda establish the long-term backend boundary early
- DynamoDB tables should be created in v1 so the data model can be shaped before user-facing auth arrives
- v1 backend endpoints can stay minimal, such as health, version, configuration, guest-session bootstrap, and future-ready write boundaries
- guest study flows must not break if the backend is unavailable

### Frontend Deployment Posture

- the frontend should remain deployable as a static web app on S3 + CloudFront
- the presence of a backend does not change the static deployment posture of the frontend
- client-side session persistence is only a thin continuity layer, not the domain model itself
- login, cloud sync, and AI-assisted review features should layer on top of the existing domain model later rather than forcing a rewrite of Learn, Practice, Exam, or Review flows

### Security And Cost Controls

- keep the S3 bucket private and serve assets through CloudFront with OAC
- use least-privilege IAM for Lambda, API Gateway, Terraform, and deployment roles
- enable API Gateway throttling and sane burst limits on public endpoints
- use AWS WAF rate-based rules to reduce abuse and request flooding
- set Lambda reserved concurrency to cap runaway execution cost
- use DynamoDB in a mode appropriate for expected traffic and pair it with CloudWatch alarms
- enable AWS Budgets and billing alarms early
- log structured request and error metadata to CloudWatch
- validate request payloads and return predictable error responses

## Functional Scope

### Certifications In Scope

- `CLF-C02`
- `SAA-C03`

### Study Modes

1. Learn Mode
2. Practice Mode
3. Exam Mode
4. Smart Review Layer

The Smart Review Layer is not a standalone mode. It sits underneath the other study experiences and resurfaces weak or overdue items. It should feel clearly inspired by flashcard apps like Anki, without trying to reproduce Anki exactly. In v1, the Review page should present two distinct systems: Flashcard Review and Question Retry.

## Content Model

### Question Schema

```ts
interface Question {
  id: string;
  cert: "CLF-C02" | "SAA-C03";
  domain: string;
  topic: string;
  difficulty: "foundational" | "intermediate" | "advanced";
  type: "multiple-choice" | "multiple-select";
  stem: string;
  options: { id: string; text: string }[];
  correctAnswers: string[];
  explanation: string;
  distractorExplanations: Record<string, string>;
  awsSourceUrls: string[];
  examVersion: string;
  tags: string[];
  status: "verified" | "community" | "draft";
  contributors: string[];
}
```

### Concept Card Schema

```ts
interface ConceptCard {
  id: string;
  cert: "CLF-C02" | "SAA-C03";
  domain: string;
  topic: string;
  type: "concept" | "comparison" | "when-to-use" | "gotcha";
  title: string;
  front: string;
  back: string;
  relatedQuestionIds: string[];
  awsSourceUrls: string[];
  tags: string[];
}
```

### Flashcard Review Schema

```ts
interface FlashcardReviewItem {
  cardId: string;
  cert: "CLF-C02" | "SAA-C03";
  domain: string;
  state: "new" | "learning" | "review" | "lapsed";
  ease: number;
  intervalDays: number;
  dueAt: string;
  repetitions: number;
  lapseCount: number;
  lastReviewedAt?: string;
  lastRating?: "forgot" | "hard" | "good" | "easy";
}
```

### Question Retry Schema

```ts
interface QuestionRetryItem {
  questionId: string;
  cert: "CLF-C02" | "SAA-C03";
  domain: string;
  status: "queued" | "due" | "cleared";
  intervalDays: number;
  dueAt: string;
  retryCount: number;
  lastAttemptResult?: "correct" | "incorrect";
  lastConfidence?: "low" | "medium" | "high";
  lastReviewedAt?: string;
}
```

Review persistence should stay simple in v1:

- flashcards and question retries should be stored separately
- flashcards use spaced-repetition states and recall ratings
- question retries use re-attempt history and simpler due scheduling

### Content Directory Structure

```text
content/
  CLF-C02/
    exam-guide.md
    domains/
      cloud-concepts/
        concepts/
        questions/
      security-and-compliance/
        concepts/
        questions/
      cloud-technology-and-services/
        concepts/
        questions/
      billing-pricing-support/
        concepts/
        questions/
  SAA-C03/
    exam-guide.md
    domains/
      secure-architectures/
        concepts/
        questions/
      resilient-architectures/
        concepts/
        questions/
      high-performing-architectures/
        concepts/
        questions/
      cost-optimized-architectures/
        concepts/
        questions/
```

## User Experience

### Learn Mode

Purpose: teach concepts before test pressure.

Flow:

- choose certification
- choose domain
- choose topic
- work through concept cards
- keep each concept card atomic and short enough to work as a reviewable flashcard later
- reveal the back of each card after attempting recall
- rate recall strength after reveal
- add concept cards to the Flashcard Review system when first encountered
- see light practice inserted after every 3 to 5 cards
- receive explanation after each question
- track progress through the topic

Content emphasis:

- `CLF-C02`: cloud concepts, service basics, billing, shared responsibility
- `SAA-C03`: architecture tradeoffs, service selection, scenario reasoning

### Practice Mode

Purpose: focused drilling and weak-area discovery.

Flow:

- choose certification
- choose domains or topics
- choose question count (`10`, `25`, `50`)
- answer one question at a time
- receive immediate correctness feedback
- read full explanation and distractor breakdown
- record confidence (`low`, `medium`, `high`)
- add missed or low-confidence questions to the Question Retry queue
- review end-of-set summary and missed items

### Exam Mode

Purpose: simulate timed exam conditions.

Supported sizes for v1:

- Quick: `20 questions / 30 min`
- Medium: `40 questions / 60 min`
- Full: `65 questions / 130 min`

Flow:

- choose certification
- choose exam size
- receive mixed questions weighted by exam domains
- flag questions during the session
- submit manually or auto-submit at time expiry
- feed missed or weak-confidence results into the Question Retry queue after scoring
- review score, domain breakdown, and per-question results

### Smart Review Layer

Purpose: resurface weak material across all modes while keeping flashcard review and full-question retry logically separate.

Review systems:

- Flashcard Review: concept cards only, spaced repetition, front/back recall flow
- Question Retry: missed or weak-confidence full questions, re-attempt flow, simpler due scheduling

Tracks:

- missed questions
- low-confidence answers
- weak domains and topics
- time since last review

Flashcard Review flow:

- show the front of a concept card
- let the user attempt recall before seeing the answer
- reveal the back of card
- let the user rate recall strength
- schedule the next appearance based on that rating

Question Retry flow:

- show the full missed or saved question again
- let the user answer it normally
- show explanation and confidence feedback
- schedule another retry if the question is still weak

Flashcard Review algorithm:

- simplified spaced-repetition scheduling inspired by Anki
- not an exact clone of Anki's algorithm or UI
- items move through `new`, `learning`, `review`, and `lapsed` states
- stronger recall increases the next interval
- forgotten items return quickly

Question Retry algorithm:

- use simpler retry intervals than flashcards
- prioritize recent misses and repeated weak-confidence answers
- clear questions from the retry queue when they are answered confidently and correctly

Review page behavior:

- if flashcards or retries are due, Review becomes the primary return path for active users
- if no review is due, the app should point the user back to Learn or Practice
- daily review should feel like a focused study deck, not a generic dashboard

## Visual Design Direction

### Design Goal

The app should feel sleek, technical, and study-focused without looking like a generic SaaS dashboard or an AI-generated template. The visual style should take cues from:

- technical field guides
- architecture diagrams
- calm workspace tools
- study cards and annotated notebooks

The design should feel credible for certification prep, but still have a distinct identity.

### Visual Personality

- clean, not sterile
- modern, not glossy
- technical, not intimidating
- warm and focused, not cold enterprise blue

### Design Principles

- prioritize reading comfort over decorative effects
- keep the main study action obvious at all times
- use strong hierarchy so progress, question state, and review status are easy to scan
- avoid generic dashboard clutter and oversized hero sections
- use a few distinctive visual motifs consistently instead of many competing effects

### Recommended Palette

Move away from purple for this product. Use a warm-neutral base with restrained teal and rust accents.

| Token | Role | Suggested Color |
| --- | --- | --- |
| `bg.canvas` | main app background | `#F3EFE7` |
| `bg.surface` | cards and panels | `#FFFCF6` |
| `bg.muted` | secondary sections | `#E7E0D4` |
| `fg.primary` | primary text | `#16202A` |
| `fg.secondary` | supporting text | `#5C6870` |
| `accent.primary` | links, active states, progress accents | `#0F766E` |
| `accent.secondary` | CTA and highlighted actions | `#C56B2D` |
| `state.success` | correct answers | `#1F8A5B` |
| `state.warning` | flagged / caution | `#B7791F` |
| `state.error` | incorrect answers | `#C2412D` |
| `border.default` | default border | `#D8D0C2` |

Palette guidance:

- use teal as the primary product accent
- use rust/amber sparingly for high-emphasis actions
- keep large surfaces light and warm rather than pure white
- avoid purple gradients, neon highlights, and black-glass styling

### Typography

Use typography that feels deliberate and technical without becoming harsh.

- heading font: `Space Grotesk`
- body font: `IBM Plex Sans`
- mono/timer/stat font: `IBM Plex Mono`

Typography rules:

- large, confident page titles
- compact and readable body copy
- monospace only for timers, score readouts, shortcut hints, and small metadata
- avoid oversized marketing-style type treatments in study flows

### Surfaces And Shapes

- cards should feel like study objects, not generic panels
- use medium-to-large radii, around `20-24px`, for primary cards
- pair soft shadows with visible borders rather than relying on shadow alone
- use layered surfaces for focus states, explanations, and review reveals
- introduce subtle background texture or diagram-grid treatment at low contrast

### Layout Strategy

Home page:

- strong header with certification switcher and immediate review count
- three prominent mode cards with distinct descriptions and visual identity
- progress and due-review summary below the fold

Study pages:

- center the primary card in a focused reading column
- keep supporting metadata visible but secondary
- use a sticky header for session progress and actions
- keep answer actions anchored consistently to reduce visual jumping

Desktop behavior:

- top navigation plus a content frame that feels like a study workspace
- optional right-side context area for domain, progress, timer, or source links

Mobile behavior:

- prioritize one-handed tap targets
- keep the question/review card dominant
- use sticky bottom actions when needed for reveal, submit, and next

### Signature Visual Motifs

To avoid a generic look, use a small number of recurring motifs:

- subtle grid or blueprint-line backgrounds
- domain badges that resemble tab markers or section labels
- progress indicators that feel like study-track markers rather than analytics charts
- citation/source links styled like referenced notes, not ordinary footer links

### Motion

Animation should support study flow, not distract from it.

- gentle page-load and section-reveal motion
- card flip or reveal transitions for concept/review cards
- confident state changes for correct/incorrect feedback
- restrained progress animations
- no floating blobs, parallax gimmicks, or continuous decorative motion

### Component Style Notes

Mode cards:

- large, asymmetrical but disciplined composition
- brief descriptive copy and one strong action
- subtle iconography or diagram shapes tied to each mode

Question cards:

- high legibility first
- answer options should feel tactile and clearly selectable
- correctness state should be obvious without overwhelming the explanation

Review cards:

- front and back states should feel intentionally different
- recall-strength actions should read as part of the study system, not generic buttons

Progress and stats:

- prefer compact indicators, ring meters, bars, and tagged summaries
- avoid dashboard-heavy chart walls in v1

### Accessibility And Readability

- maintain strong text contrast on all warm-neutral backgrounds
- never rely on color alone for correctness or review status
- ensure keyboard-friendly flows for review sessions
- support reduced motion preferences
- keep reading width tight enough for dense explanations

## Navigation And Layout

### Primary Navigation

- logo
- `CLF-C02`
- `SAA-C03`
- Review
- Progress
- Settings

### Home Page

- first-time users should see certification selection and a clear `Start Learning` primary action
- returning users with due items should see `Review Due Items` as the primary action
- returning users with an unfinished session but no due review should see `Resume Session`
- Learn, Practice, and Exam remain visible as secondary mode choices
- recent progress and weak-area summary appear below the primary CTA area

### Question Card Behavior

Question sessions should show:

- current item index
- domain label
- question stem
- selectable answers
- submit/check action

Post-answer state should show:

- correct or incorrect state
- confidence selector
- explanation for the correct answer
- explanation for each distractor
- citation link to AWS documentation
- next-question action

### Review Card Behavior

Review sessions should show:

- a clear split between Flashcard Review and Question Retry
- front/reveal/back flow for flashcards
- full re-attempt flow for question retries
- recall-strength actions only for flashcards
- confidence and correctness feedback for question retries
- next due item action

### Design System Notes

- define colors as CSS variables in `globals.css`
- define spacing, radius, border, and shadow tokens early
- use a small, repeatable set of card shells instead of many one-off layouts
- keep component primitives accessible and themeable from the beginning

## Content Pipeline

### Phase 1: Seed Bank

- manually create `50-100` high-quality questions per certification
- require official AWS documentation citations
- allow AI to help draft wording, but require manual review and approval
- mark seeded launch questions as `verified`

### Phase 2: Community Contributions

Contribution requirements:

- certification version
- domain and topic tags
- AWS documentation URLs
- correct-answer explanation
- distractor explanations
- valid schema shape

Community-submitted content starts as `community` and can later be promoted to `verified`.

### Phase 3: Quality Controls

- show a `verified` badge in the UI
- allow filtering to `verified only` or all questions
- flag content when AWS exam versions change
- validate content in CI

## Content Policy

To avoid drifting into exam-dump territory:

- do not copy official AWS practice questions
- do not use recalled or leaked exam content
- base all questions on public AWS docs only
- require citations for every question
- state these rules clearly in `CONTRIBUTING.md`

## Proposed Project Structure

```text
aws-cert-practice/
  backend/
    rust-api/
      Cargo.toml
      src/
        main.rs
        config/
        handlers/
        services/
        repositories/
        models/
        errors/
  src/
    app/
      page.tsx
      [cert]/
        learn/page.tsx
        practice/page.tsx
        exam/page.tsx
      review/page.tsx
      progress/page.tsx
    components/
      ui/
        button.tsx
        timer.tsx
        progress-bar.tsx
      study/
        study-card-shell.tsx
        question-card.tsx
        flashcard.tsx
        question-retry-card.tsx
        domain-selector.tsx
        confidence-picker.tsx
        results-summary.tsx
        review-badge.tsx
    contracts/
      api.ts
    features/
      api/
        client.ts
      content/
        catalog.ts
        question-loader.ts
      review/
        flashcard-scheduler.ts
        question-retry.ts
        review-selectors.ts
      identity/
        guest-session.ts
      sessions/
        learn-session.ts
        practice-session.ts
        exam-session.ts
      progress/
        progress-tracker.ts
      exams/
        exam-generator.ts
    generated/
      content-catalog.ts
    types/
      question.ts
      concept.ts
      review.ts
      progress.ts
  infra/
    terraform/
      modules/
        frontend-static-site/
        api/
        data/
        monitoring/
      environments/
        dev/
  content/
    CLF-C02/
    SAA-C03/
  scripts/
    build-content.ts
    validate-questions.ts
    generate-stats.ts
  .github/
    ISSUE_TEMPLATE/
      new-question.md
    pull_request_template.md
    workflows/
      validate.yml
  public/
  CONTRIBUTING.md
  README.md
```

## Implementation Plan

### Sprint 1: Foundation

- initialize Next.js + TypeScript + Tailwind + shadcn/ui + pnpm
- define the guest-first v1 user model and first-run behavior
- define core TypeScript types
- define guest-session handling and backend contract boundaries
- define visual design tokens and base typography
- build the initial app shell and navigation frame
- implement the content build pipeline and generated catalog
- implement question loader against generated content data
- build the shared study card shell
- build initial question card component
- bootstrap the Rust Lambda project structure
- define the initial API boundary and request/response contracts
- create the Terraform skeleton for frontend, API, and data resources
- seed `10-15` questions per cert for testing

### Sprint 2: Practice Mode

- domain/topic selector
- practice session flow
- answer feedback state
- confidence picker
- enqueue missed or low-confidence questions for Question Retry
- results summary
- local session history

### Sprint 3: Learn Mode

- flashcard component
- front/back reveal flow
- recall-strength rating after reveal
- topic progression flow
- inline practice insertion
- add atomic concept cards into Flashcard Review
- topic progress tracking

### Sprint 4: Exam Mode

- timer
- weighted exam generation
- question flagging
- post-exam review screen

### Sprint 5: Smart Review + Polish

- Flashcard Review scheduler
- Question Retry scheduler
- Review page UI with separate flashcard and question-retry sections
- due-item review session flows
- primary CTA logic for first-run, due review, and resume-session states
- progress dashboard
- PWA support
- security hardening pass for API throttling, WAF, and alarms
- dark mode

### Sprint 6: Community Pipeline

- JSON schema validation
- contribution templates
- question status badges
- repo docs and screenshots

## Testing Strategy

### Unit Tests

- flashcard spaced-repetition algorithm
- question-retry scheduling rules
- review state transitions (`new`, `learning`, `review`, `lapsed`)
- storage migrations
- generated content catalog build step
- question loader
- exam generator domain weighting

### Component Tests

- question card rendering and state transitions
- concept/review card reveal and recall rating flow
- timer behavior
- confidence picker persistence

### End-To-End Tests

- first-time user chooses a cert and starts Learn Mode
- complete a Learn Mode topic and create flashcard review items
- miss questions in Practice Mode and create question-retry items
- return as a user with due review and enter Review from the home page
- complete both a flashcard review session and a question-retry session

### Content Validation

- validate all question JSON files in CI
- enforce required fields
- enforce URL format

### Manual Validation

- walk each study mode end-to-end
- verify explanation rendering
- verify review resurfacing behavior
- run Lighthouse for performance, accessibility, and PWA quality

## Key Risks And Open Questions

- How much of v1 should work fully offline versus "offline after first visit"?
- How should guest-session continuity behave before Cognito-backed persistence exists?
- Should concept-card source files stay markdown-based with strict structure, or move to a more explicitly structured format?
- Should the app eventually support downloadable per-cert offline packs, or only cache content after first use?
- When Cognito is introduced, how should guest progress merge into authenticated cloud progress?
- Which public endpoints should exist before login is added, and which should stay disabled until auth exists?
- What is the minimum launch question count that still feels credible to users?
- How strict should certification-domain weighting be when question banks are still small?

## Immediate Next Step

Turn Sprint 1 into an execution checklist with:

- concrete repo setup tasks
- file and folder creation order
- initial type definitions
- client storage abstraction for local progress data
- initial content build pipeline
- initial Flashcard Review and Question Retry boundaries
- question/content seeding checklist
- acceptance criteria for the first implementable milestone
