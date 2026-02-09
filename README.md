# Clarify

Personal execution layer scaffold. Includes Next.js 14 App Router, Tailwind, Prisma, and NextAuth (Credentials) stubs.

Quickstart
1. Install dependencies: `npm install`
2. Copy env: `copy .env.example .env`
3. Run Prisma migration: `npm run db:migrate`
4. Seed data: `npm run db:seed`
5. Start dev server: `npm run dev`

Plan tracking
- `docs/12-week-plan.md` for the full plan
- `docs/plan-tracker.md` for weekly execution and status
- `docs/weekly-update-template.md` for weekly check-ins

What is wired
- NextAuth (Credentials) client with login and signup pages
- Interpret, plan, execute API routes
- Basic pipeline runner UI on the home page
- Prisma schema + seed script

Notes
- NextAuth (Credentials) uses AUTH_DEMO_EMAIL and AUTH_DEMO_PASSWORD in `.env`. Configure NEXTAUTH_URL and NEXTAUTH_SECRET.
- The pipeline APIs call stubbed logic in `src/lib/interpret`, `src/lib/plan`, `src/lib/execute`.
