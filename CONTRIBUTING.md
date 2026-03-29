# Contributing

## Development Requirements

- Node.js 20+
- pnpm 9+
- Rust / cargo (latest stable)
- Terraform 1.6+

## Local Setup

Install dependencies:

```bash
pnpm install
```

Start the app locally:

```bash
pnpm dev
```

## Project Docs

- [README.md](./README.md) -- project overview
- [DESIGN.md](./DESIGN.md) -- architecture and scope
- [EXECUTION_CHECKLIST.md](./EXECUTION_CHECKLIST.md) -- current implementation order

## Workflow

- Create a branch from `main`
- Keep one checklist step per branch
- Keep changes small and reviewable
- Update docs when architectural decisions change

## Content Contributions

- Use official AWS documentation as the source for all questions and concepts
- Include explanations for the correct answer and every distractor
- No copied or leaked exam content
- Keep question and concept IDs stable across edits
- Ensure schema validation passes before submitting

## Code Guidelines

- Keep frontend and backend boundaries clean
- No ad hoc fetch calls in UI components -- use the API client layer
- Do not treat browser storage as source of truth
- Keep Flashcard Review and Question Retry as separate models

## Verification Before Merge

```bash
pnpm lint
pnpm typecheck
pnpm build
cargo check            # when backend changes
terraform fmt          # when infra changes
terraform validate     # when infra changes
```
