# AWS Cert Practice App Design Doc

## Status

- Version: v1
- Date: 2026-03-26
- Scope: Initial product and implementation plan

## Overview

AWS Cert Practice App is an open-source study platform for AWS certification prep. The initial release targets:

- AWS Certified Cloud Practitioner (`CLF-C02`)
- AWS Certified Solutions Architect - Associate (`SAA-C03`)

The product goal is to offer a free, transparent, community-driven alternative to paid certification platforms, while staying clearly separate from exam-dump territory. All learning content should be based on public AWS documentation and original explanations.

V1 should be treated as a browser-first web app, with PWA/offline support as a product goal. That makes local browser storage the default persistence model for user progress and review data.

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

## Core Principles

- Local-first by default
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
| Styling | Tailwind CSS + shadcn/ui | Fast UI delivery with accessible primitives |
| Local persistence | IndexedDB via a thin storage wrapper | Best fit for a browser-based local-first app |
| Server sync | None in v1 | Avoid infra coupling until sync is justified |
| Auth | None in v1; optional later | Local-first usage should not require an account |
| Client state | Zustand | Lightweight session state management |
| Content format | Markdown + JSON in repo | Easy PR review and versioning |
| Deployment | Vercel | Low-friction OSS deployment |
| Package manager | pnpm | Fast and common for modern TS apps |

### Why Browser-Local IndexedDB

- it is the most practical local persistence option for a browser-first app
- it supports offline-friendly study flows without requiring a server database
- it keeps review history, session data, and progress on the user's machine by default
- it avoids shipping desktop-specific persistence complexity before it is needed
- it still allows an optional hosted sync layer later

### What Is Stored Locally In v1

- review queue and spaced-repetition state
- question history and results
- confidence ratings
- flagged or saved items
- progress summaries
- local settings and preferences

## Functional Scope

### Certifications In Scope

- `CLF-C02`
- `SAA-C03`

### Study Modes

1. Learn Mode
2. Practice Mode
3. Exam Mode
4. Smart Review Layer

The Smart Review Layer is not a standalone mode. It sits underneath the other study experiences and resurfaces weak or overdue items. It should feel clearly inspired by flashcard apps like Anki, without trying to reproduce Anki exactly.

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

### Review Item Schema

```ts
type ReviewableItemType = "concept-card" | "question";

interface ReviewItem {
  itemId: string;
  itemType: ReviewableItemType;
  cert: "CLF-C02" | "SAA-C03";
  domain: string;
  state: "new" | "learning" | "review" | "lapsed";
  ease: number;
  intervalDays: number;
  dueAt: string;
  repetitions: number;
  lapseCount: number;
  lastReviewedAt?: string;
  lastResult?: "forgot" | "hard" | "good" | "easy";
  lastConfidence?: "low" | "medium" | "high";
}
```

Review items should support both:

- concept cards introduced in Learn Mode
- questions that were missed, marked low-confidence, or manually saved for review

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
- reveal the back of each card after attempting recall
- rate recall strength after reveal
- add concept cards to the spaced-review system when first encountered
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
- add missed or low-confidence questions to the review queue
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
- feed missed or weak-confidence results into the review queue after scoring
- review score, domain breakdown, and per-question results

### Smart Review Layer

Purpose: resurface weak material across all modes with a flashcard-style spaced-review experience.

Reviewable items:

- concept cards from Learn Mode
- missed questions from Practice or Exam Mode
- low-confidence questions
- manually saved questions

Tracks:

- missed questions
- low-confidence answers
- weak domains and topics
- time since last review

Review session flow:

- show the front of a concept card or the prompt for a saved question
- let the user attempt recall before seeing the answer
- reveal the explanation or back of card
- let the user rate recall strength
- schedule the next appearance based on that rating

Initial algorithm:

- simplified spaced-repetition scheduling inspired by Anki
- not an exact clone of Anki's algorithm or UI
- items move through `new`, `learning`, `review`, and `lapsed` states
- stronger recall increases the next interval
- forgotten items return quickly
- due items appear in a review queue with badge count
- daily review should feel like a study deck, not just a list of missed questions

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

- certification selector
- prominent review summary and due count near the top
- three visually distinct mode cards: Learn, Practice, Exam
- recent progress and weak-area summary below

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

- front/prompt first
- reveal action
- back/explanation state
- recall-strength buttons
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
      question-card.tsx
      concept-card.tsx
      timer.tsx
      progress-bar.tsx
      domain-selector.tsx
      confidence-picker.tsx
      results-summary.tsx
      review-badge.tsx
    lib/
      spaced-repetition.ts
      question-loader.ts
      progress-tracker.ts
      exam-generator.ts
      storage.ts
    types/
      question.ts
      concept.ts
      review.ts
      progress.ts
  content/
    CLF-C02/
    SAA-C03/
  scripts/
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
- define core TypeScript types
- define visual design tokens and base typography
- build the initial app shell and navigation frame
- implement question loader for repo content
- build initial question card component
- seed `10-15` questions per cert for testing

### Sprint 2: Practice Mode

- domain/topic selector
- practice session flow
- answer feedback state
- confidence picker
- enqueue missed or low-confidence questions for later review
- results summary
- local session history

### Sprint 3: Learn Mode

- concept card component
- front/back reveal flow
- recall-strength rating after reveal
- topic progression flow
- inline practice insertion
- topic progress tracking

### Sprint 4: Exam Mode

- timer
- weighted exam generation
- question flagging
- post-exam review screen

### Sprint 5: Smart Review + Polish

- spaced repetition engine
- review queue UI
- concept-card and question review support
- due-item review session flow
- progress dashboard
- PWA support
- dark mode

### Sprint 6: Community Pipeline

- JSON schema validation
- contribution templates
- question status badges
- repo docs and screenshots

## Testing Strategy

### Unit Tests

- spaced repetition algorithm
- review state transitions (`new`, `learning`, `review`, `lapsed`)
- question loader
- exam generator domain weighting

### Component Tests

- question card rendering and state transitions
- concept/review card reveal and recall rating flow
- timer behavior
- confidence picker persistence

### End-To-End Tests

- select cert
- complete a Learn Mode topic
- add due review items
- complete a review session

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
- Should v1 include export/import of local progress to reduce the risk of browser data loss?
- Should Learn Mode concept cards also live as structured JSON/MDX instead of plain markdown files?
- How should the review queue balance concept-card review versus missed-question review when both are due?
- When sync becomes real, what backend should own it and how should local-first conflict resolution work?
- What is the minimum launch question count that still feels credible to users?
- How strict should certification-domain weighting be when question banks are still small?

## Immediate Next Step

Turn Sprint 1 into an execution checklist with:

- concrete repo setup tasks
- file and folder creation order
- initial type definitions
- client storage abstraction for local progress data
- initial review schema and scheduler boundaries
- question/content seeding checklist
- acceptance criteria for the first implementable milestone
