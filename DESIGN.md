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
- three mode cards: Learn, Practice, Exam
- review summary and due count

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
