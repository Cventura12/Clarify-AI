# Clarify AI

Personal execution layer scaffold. Includes Next.js 14 App Router, Tailwind, Prisma, and OpenAI + Zod validation for interpret/plan.

Quickstart
1. Install dependencies: `npm install`
2. Copy env: `copy .env.example .env.local` (or update `.env` directly)
3. Set `DATABASE_URL` and `OPENAI_API_KEY`
4. Optional: set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` for file storage
5. Optional: set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` to enable Google OAuth + Gmail/Calendar
6. Optional: set `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET`, `NOTION_REDIRECT_URI` to enable Notion OAuth
7. Run Prisma migration: `npm run db:migrate`
8. Seed data: `npm run db:seed`
9. Start dev server: `npm run dev`

Plan tracking
- `docs/12-week-plan.md` for the full plan
- `docs/plan-tracker.md` for weekly execution and status
- `docs/weekly-update-template.md` for weekly check-ins

What is wired
- Interpret + plan API routes with OpenAI + Zod validation
- Prisma schema for Request/Task/Plan/Step
- Dashboard UI with CommandBar, TaskCard, and PlanView
- Draft editing and email sending via Gmail (requires Google OAuth)
- R2-backed file storage with search (falls back to local URL if R2 is not configured)
- Profile-driven form auto-fill and a deadlines calendar view
- Onboarding flow, memory log, context graph, and pattern insights
- Integrations hub with Google OAuth + Gmail/Calendar sync + webhooks
- Confidence scoring, plan review pass, and fallback AI responses

Notes
- No auth in Week 1. Google OAuth starts Week 6.
- The AI response is always validated before storage.
