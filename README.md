# AWS-Cert-Practice

Open-source AWS certification practice app with guided learning, practice quizzes, exam simulations, and spaced review.

Initial certification targets:

- AWS Certified Cloud Practitioner (`CLF-C02`)
- AWS Certified Solutions Architect - Associate (`SAA-C03`)

## Prerequisites

| Tool | Minimum Version | Needed For |
|------|----------------|------------|
| Node.js | 20+ | Next.js, build tooling |
| pnpm | 9+ | Package management |
| Rust / cargo | latest stable | Backend Lambda (Sprint 1 Step 5+) |
| Terraform | 1.6+ | AWS infrastructure (Sprint 1 Step 6+) |

## Local Setup

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open `http://localhost:3000` in your browser.

## Project Docs

- Design doc: [DESIGN.md](./DESIGN.md)

## Notes

- The app is a browser-first web app with a serverless AWS backend (Lambda + DynamoDB).
- User progress and review data are persisted via the backend; browser storage is non-authoritative.
