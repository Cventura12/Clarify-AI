# Clarify Plan Tracker

Start date: 2026-02-09
Target demo date: 2026-05-04
Current week: Week 5 (Email and Communication Actions)

How to use this file
- Update the Start date and Current week
- Check off tasks weekly
- Add notes under each week for blockers and decisions

## Week 1 - Project Setup and Architecture
Goals
- [x] Initialize Next.js 14 project with App Router
- [x] Set up PostgreSQL + Prisma schema (request/task/plan/step/execution log)
- [x] No auth in Week 1 (Supabase Auth starts Week 6)
- [x] Build base layout: sidebar, main content, command bar shell

Deliverables
- [ ] Deployed repo on Vercel with CI/CD
- [x] Database schema migrated (seed script available)
- [ ] Auth flow working (signup/login/logout)
- [x] Base UI layout responsive on desktop

Notes
- Vercel deploy not verified yet.
- Auth intentionally omitted per Week 1 rules.
- Seed script exists but not run.

## Week 2 - Input Layer (Interpret Pipeline)
Goals
- [x] Build natural language input interface (command bar + chat)
- [x] Integrate OpenAI API for intent parsing
- [x] Create the Interpret module: parse user input into structured task objects
- [x] Handle ambiguity detection and clarification prompts

Deliverables
- [x] User can type natural language requests
- [x] OpenAI parses input into task schema (type, urgency, context, steps)
- [x] Clarification flow when input is ambiguous
- [x] Input history stored in database

Notes
- Interpret API validates with Zod and persists Request + Task records.

## Week 3 - Plan Pipeline and Task Engine
Goals
- [x] Build the Plan module: break interpreted tasks into executable steps
- [ ] Create task queue and dependency graph
- [ ] Implement priority scoring algorithm (urgency x importance x deadline)
- [x] Build task dashboard with status tracking

Deliverables
- [x] Tasks auto-decompose into ordered steps
- [ ] Priority queue ranks tasks intelligently
- [x] Dashboard shows all active tasks with status
- [ ] Manual reordering and editing of plans

Notes
- Plan pipeline implemented; queue, graph, and scoring not built yet.

## Week 4 - Execute Pipeline (Actions Framework)
Goals
- [x] Build the Execute module: action execution framework
- [x] Create action types: draft email, fill form data, generate document, set reminder
- [x] Implement human-in-the-loop approval flow
- [x] Build execution log and audit trail

Deliverables
- [x] Execute engine runs planned steps sequentially
- [x] User approves or rejects each action before execution
- [x] Execution history with audit trail
- [x] At least 3 action types working end-to-end

Notes
- Execution is step-based (no automatic sequencing runner yet).

## Week 5 - Email and Communication Actions
Goals
- [x] Build email drafting and sending integration
- [x] Create follow-up detection and scheduling
- [x] Implement template system for common communications
- [x] Build notification system for pending actions

Deliverables
- [x] Draft and send emails through Clarify
- [x] Auto-detect when follow-ups are needed
- [x] Template library for common email types
- [x] Notifications for due actions

Notes
- Drafting + sending routes are implemented; requires RESEND_API_KEY and RESEND_FROM to send real emails.

## Week 6 - Document and Form Automation
Goals
- [x] Build document generation from templates
- [x] Create form-filling automation (extract fields, populate data)
- [x] Implement file storage and organization
- [x] Build deadline tracking with smart reminders

Deliverables
- [x] Generate documents from user data and templates
- [x] Auto-fill common form fields from user profile
- [x] File management system with search
- [x] Deadline calendar with escalating reminders

Notes
- Storage now supports R2; set env vars to enable uploads.
- Reminders are local (no calendar sync).

## Week 7 - User Context and Memory System
Goals
- [x] Build user context graph (personal info, preferences, history)
- [x] Implement conversation memory across sessions
- [x] Create smart suggestions based on patterns
- [x] Build onboarding flow that captures key user context

Deliverables
- [x] Persistent user context that improves over time
- [x] Clarify remembers past tasks and preferences
- [x] Proactive suggestions based on user patterns
- [x] Guided onboarding captures life admin profile

Notes
- Context graph, memory log, onboarding, and pattern insights are live.

## Week 8 - Integrations and External Services
Goals
- [x] Build OAuth integration framework
- [x] Connect Google Calendar for deadline sync
- [x] Implement webhook system for external triggers
- [x] Create integration marketplace UI

Deliverables
- [x] Google Calendar sync working
- [ ] At least 2 additional integrations (Notion, Slack, or similar)
- [x] Webhook endpoints for external triggers
- [x] Integration management page

Notes
- Google Calendar sync is wired but requires access token + calendar id.

## Week 9 - AI Intelligence Layer
Goals
- [x] Implement multi-step reasoning for complex tasks
- [x] Build confidence scoring for AI decisions
- [x] Create fallback strategies when automation fails
- [ ] Optimize prompt chains for speed and accuracy

Deliverables
- [x] Complex multi-step tasks execute reliably
- [x] Confidence indicators on all AI actions
- [x] Graceful degradation with human fallback
- [ ] Response times under 3 seconds for common tasks

Notes
- AI review pass enabled for complex plans. Confidence scores stored per task and plan.

## Week 10 - UI Polish and User Experience
Goals
- [ ] Polish all UI components and animations
- [ ] Implement dark mode and theme system
- [ ] Build mobile-responsive experience
- [ ] Add loading states, error handling, and edge cases

Deliverables
- [ ] Polished UI across all pages
- [ ] Dark mode toggle
- [ ] Fully responsive on mobile and tablet
- [ ] Zero unhandled error states

Notes
- Current UI matches prototype, but polish tasks remain.

## Week 11 - Testing, Performance, and Security
Goals
- [ ] Write integration tests for critical paths
- [ ] Performance audit and optimization
- [ ] Security review (auth, data handling, API keys)
- [ ] Load testing and rate limiting

Deliverables
- [ ] Test coverage on critical flows
- [ ] Lighthouse score 90+ on all pages
- [ ] Security audit passed with no critical issues
- [ ] Rate limiting and abuse prevention active

Notes
- Test scaffolding exists but no verified coverage yet.

## Week 12 - Demo Build and Pitch Prep
Goals
- [ ] Build guided demo flow with sample scenarios
- [ ] Record product demo video (2-3 minutes)
- [ ] Create pitch deck (problem, solution, demo, market, team)
- [ ] Prepare for live demo with backup plans

Deliverables
- [ ] Scripted demo flow that showcases full pipeline
- [ ] Polished demo video ready for sharing
- [ ] 10-slide pitch deck
- [ ] Live demo environment with seed data
- [ ] One-pager with key metrics and vision

Notes
- Not started yet.
