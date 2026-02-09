# Clarify 12-Week Build Plan

## What is Clarify?
Clarify is a personal execution layer - an AI platform that handles complex admin work through a three-stage pipeline.

- Interpret: Understands what you need from natural language input.
- Plan: Breaks complex tasks into executable steps with prioritization and dependencies.
- Execute: Takes action on your behalf with human approval at every step.

Think of it as a chief of staff for life admin: follow-up emails, scholarship deadlines, job applications, portal navigation, and document preparation.

## Build Plan Overview
- Foundation (Weeks 1-3): Project scaffolding, auth, database, and the core interpret + plan pipeline.
- Core Build (Weeks 4-6): Execute pipeline comes alive.
- Intelligence (Weeks 7-9): Context memory, external integrations, and AI upgrades.
- Polish and Demo (Weeks 10-12): UI refinement, testing, performance, and demo materials.

## Tech Stack
- Frontend: Next.js 14 (App Router), React, Tailwind CSS
- Backend: Next.js API Routes, Prisma ORM, PostgreSQL
- AI: Claude API (interpret, plan, execute prompts), prompt chaining
- Auth: Supabase Auth
- Infra: Vercel, Supabase, Cloudflare R2 (file storage)
- Integrations: Google Calendar, Resend (email), webhooks

## Weekly Breakdown

### Week 1 | Project Setup and Architecture | Foundation
Goals
- Initialize Next.js 14 project with App Router
- Set up PostgreSQL + Prisma schema (users, tasks, obligations, pipelines)
- Configure authentication (Supabase Auth or NextAuth)
- Build base layout: sidebar, main content, command bar shell

Deliverables
- Deployed repo on Vercel with CI/CD
- Database schema migrated and seeded
- Auth flow working (signup/login/logout)
- Base UI layout responsive on desktop

### Week 2 | Input Layer - Interpret Pipeline | Foundation
Goals
- Build natural language input interface (command bar + chat)
- Integrate Claude API for intent parsing
- Create the Interpret module: parse user input into structured task objects
- Handle ambiguity detection and clarification prompts

Deliverables
- User can type natural language requests
- Claude parses input into task schema (type, urgency, context, steps)
- Clarification flow when input is ambiguous
- Input history stored in database

### Week 3 | Plan Pipeline and Task Engine | Foundation
Goals
- Build the Plan module: break interpreted tasks into executable steps
- Create task queue and dependency graph
- Implement priority scoring algorithm (urgency x importance x deadline)
- Build task dashboard with status tracking

Deliverables
- Tasks auto-decompose into ordered steps
- Priority queue ranks tasks intelligently
- Dashboard shows all active tasks with status
- Manual reordering and editing of plans

### Week 4 | Execute Pipeline - Actions Framework | Core Build
Goals
- Build the Execute module: action execution framework
- Create action types: draft email, fill form data, generate document, set reminder
- Implement human-in-the-loop approval flow
- Build execution log and audit trail

Deliverables
- Execute engine runs planned steps sequentially
- User approves or rejects each action before execution
- Execution history with audit trail
- At least 3 action types working end-to-end

### Week 5 | Email and Communication Actions | Core Build
Goals
- Build email drafting and sending integration
- Create follow-up detection and scheduling
- Implement template system for common communications
- Build notification system for pending actions

Deliverables
- Draft and send emails through Clarify
- Auto-detect when follow-ups are needed
- Template library for common email types
- Notifications for due actions

### Week 6 | Document and Form Automation | Core Build
Goals
- Build document generation from templates
- Create form-filling automation (extract fields, populate data)
- Implement file storage and organization
- Build deadline tracking with smart reminders

Deliverables
- Generate documents from user data and templates
- Auto-fill common form fields from user profile
- File management system with search
- Deadline calendar with escalating reminders

### Week 7 | User Context and Memory System | Intelligence
Goals
- Build user context graph (personal info, preferences, history)
- Implement conversation memory across sessions
- Create smart suggestions based on patterns
- Build onboarding flow that captures key user context

Deliverables
- Persistent user context that improves over time
- Clarify remembers past tasks and preferences
- Proactive suggestions based on user patterns
- Guided onboarding captures life admin profile

### Week 8 | Integrations and External Services | Intelligence
Goals
- Build OAuth integration framework
- Connect Google Calendar for deadline sync
- Implement webhook system for external triggers
- Create integration marketplace UI

Deliverables
- Google Calendar sync working
- At least 2 additional integrations (Notion, Slack, or similar)
- Webhook endpoints for external triggers
- Integration management page

### Week 9 | AI Intelligence Layer | Intelligence
Goals
- Implement multi-step reasoning for complex tasks
- Build confidence scoring for AI decisions
- Create fallback strategies when automation fails
- Optimize prompt chains for speed and accuracy

Deliverables
- Complex multi-step tasks execute reliably
- Confidence indicators on all AI actions
- Graceful degradation with human fallback
- Response times under 3 seconds for common tasks

### Week 10 | UI Polish and User Experience | Polish and Demo
Goals
- Polish all UI components and animations
- Implement dark mode and theme system
- Build mobile-responsive experience
- Add loading states, error handling, and edge cases

Deliverables
- Polished UI across all pages
- Dark mode toggle
- Fully responsive on mobile and tablet
- Zero unhandled error states

### Week 11 | Testing, Performance, and Security | Polish and Demo
Goals
- Write integration tests for critical paths
- Performance audit and optimization
- Security review (auth, data handling, API keys)
- Load testing and rate limiting

Deliverables
- Test coverage on critical flows
- Lighthouse score 90+ on all pages
- Security audit passed with no critical issues
- Rate limiting and abuse prevention active

### Week 12 | Demo Build and Pitch Prep | Polish and Demo
Goals
- Build guided demo flow with sample scenarios
- Record product demo video (2-3 minutes)
- Create pitch deck (problem, solution, demo, market, team)
- Prepare for live demo with backup plans

Deliverables
- Scripted demo flow that showcases full pipeline
- Polished demo video ready for sharing
- 10-slide pitch deck
- Live demo environment with seed data
- One-pager with key metrics and vision
