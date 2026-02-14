# Choirmaster MVP Backend Wiring Roadmap

This document is the authoritative roadmap for MVP backend wiring. It will be referenced in all future implementation threads.

## Project status
- UI prototype is live.
- UI, layout, routes, and components are locked and must not change.
- We are now wiring functionality only.

## Absolute constraints
- No UI redesign.
- No route renaming.
- No structural refactors unless required for backend wiring.
- Work only in new feature branches.
- After each increment: commit + push + Vercel preview deploy.

## Core domain model (final schema overview)
- ensembles
- persons
- ensemble_memberships
- projects
- rehearsals
- project_participants
- availability
- project_access_tokens
- associations
- ensemble_association_memberships

## MVP phases

### Phase 0 – Branch & environment sanity
**Short description**: Establish a clean feature branch and verify local and remote tooling are ready for incremental backend wiring.

**Deliverable definition**
- A new feature branch created from the current mainline.
- Baseline environment checks complete (Supabase, Vercel, local dev).

**Success criteria**
- Branch exists and is pushed to GitHub.
- Local app starts without errors.
- Vercel preview is available for the branch.

**Done means deployed to Vercel preview and manually tested**

### Phase 1 – Supabase foundation
**Short description**: Stand up the Supabase project plumbing needed for MVP data storage and access.

**Deliverable definition**
- Supabase project configured for the app.
- Database schema created for the MVP domain model.
- Environment variables wired for local and Vercel preview.

**Success criteria**
- Supabase tables exist and match the core domain model.
- Local and preview environments connect successfully.
- Basic health check or connectivity check passes.

**Done means deployed to Vercel preview and manually tested**

### Phase 2 – Authentication
**Short description**: Enable user authentication and identity mapping to `persons`.

**Deliverable definition**
- Auth provider enabled and configured in Supabase.
- App wired to sign in/out and read the authenticated user.
- Authenticated user mapped to `persons` record.

**Success criteria**
- Users can sign in and sign out.
- Authenticated session persists and is readable by the app.
- A `persons` record is created or linked on first sign-in.

**Done means deployed to Vercel preview and manually tested**

### Phase 3 – Invitation link flow
**Short description**: Support invite-based access via project access tokens.

**Deliverable definition**
- Token issuance and validation backed by `project_access_tokens`.
- Invite link flow connects users to ensembles and projects.
- Basic permission checks applied for token usage.

**Success criteria**
- Invite link creates or links `project_participants`.
- Token usage is validated and recorded.
- Expired or invalid tokens are rejected gracefully.

**Done means deployed to Vercel preview and manually tested**

### Phase 4 – Attendance tracking
**Short description**: Wire rehearsal attendance and availability to real data.

**Deliverable definition**
- Rehearsal lists read from `rehearsals`.
- Attendance updates stored in `availability`.
- UI reads current attendance state.

**Success criteria**
- Attendance updates persist and re-render correctly.
- Availability is scoped to the correct person, project, and rehearsal.
- Manual QA confirms accuracy across multiple users.

**Done means deployed to Vercel preview and manually tested**

### Phase 5 – CSV import
**Short description**: Import ensembles, persons, and memberships via CSV for fast onboarding.

**Deliverable definition**
- CSV ingestion pipeline for `persons` and `ensemble_memberships`.
- Validation and error reporting for malformed files.
- Import results are visible in the app.

**Success criteria**
- Valid CSV imports create correct records.
- Invalid rows are reported without halting the entire import.
- Imported data appears immediately in relevant views.

**Done means deployed to Vercel preview and manually tested**

## Implementation discipline
- Small increments only.
- No cross-phase mixing.
- Always deployable state.
