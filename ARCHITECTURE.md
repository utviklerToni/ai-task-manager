# Architecture — AI Task Manager

## Why I built it this way

I had 48 hours and needed something that works end to end — not a prototype, not a demo, a real production-quality app. So every decision I made was about reducing surface area for things to go wrong while still building something technically interesting.

---

## Stack decisions

### Next.js 16 App Router

I chose Next.js over a separate React frontend + Express backend because for a project this size, having the full stack in one framework is genuinely the right call. Server Components let me fetch data directly from the database without writing a separate API endpoint just for page loads. The App Router's file-based routing keeps things predictable — any new developer can look at the `src/app` folder and immediately understand what routes exist.

The alternative was a React SPA + separate Node.js API. That would have been more familiar territory for me, but it also means managing CORS, two separate deployments, two sets of environment variables, and two things that can break. Not worth it here.

### Supabase over raw PostgreSQL

I know PostgreSQL well — I've used it in production at ICICI and AirAsia. I could have set up a raw Postgres instance on Railway or Render. But Supabase gives me three things for free that would have taken hours to build:

1. **Managed PostgreSQL** — no server to maintain
2. **Auth system** — email/password out of the box, no rolling my own password hashing flow
3. **Row Level Security** — database-level access control that I can define once and forget

The RLS policies are the most important part. Even if my application code had a bug that leaked a user ID, Supabase would still reject the query at the database level. That's defence in depth.

### NextAuth v5 over Supabase Auth directly

This one took me a moment. Supabase has its own auth client, so why add NextAuth?

Two reasons:

First, NextAuth integrates with Next.js's cookie and session handling in a way that just works with the App Router. The `auth()` function I can call from any Server Component or API route without any setup — it reads the JWT from the cookie automatically.

Second, if I wanted to add Google or GitHub OAuth later, NextAuth makes that a 10-line change. Rolling my own OAuth flow is a week of work.

The trade-off is complexity — two auth systems touching each other. The way I resolved it: Supabase manages the user records and password verification. NextAuth manages the session. They hand off at login time and don't need to talk to each other after that.

### Anthropic Claude over OpenAI

The assignment specifically mentioned Claude. Also, for structured JSON output, Claude's instruction-following is excellent — when I tell it to respond with only a JSON object and nothing else, it does exactly that. OpenAI is reliable too, but I've had more consistent results with Claude for constrained output formats.

### Tailwind CSS v3

I specifically locked to v3. v4 has breaking changes around the config file structure and some utility classes work differently. For a 48-hour project, that's a risk I didn't need to take. v3 is battle-tested, the documentation is comprehensive, and every Stack Overflow answer from the last 3 years applies to it.

---

## Database schema

```sql
tasks
  id                uuid          PRIMARY KEY
  user_id           uuid          REFERENCES auth.users(id) ON DELETE CASCADE
  title             text          NOT NULL
  description       text
  status            text          DEFAULT 'todo'    -- todo | in-progress | done
  priority          text          DEFAULT 'medium'  -- low | medium | high
  category          text          DEFAULT 'general'
  due_date          timestamptz
  estimated_minutes integer
  subtasks          jsonb         DEFAULT '[]'
  ai_generated      boolean       DEFAULT false
  created_at        timestamptz   DEFAULT now()
  updated_at        timestamptz   DEFAULT now()
```

A few decisions worth explaining:

**subtasks as JSONB instead of a separate table** — Subtasks don't exist independently. They only make sense in the context of a parent task, and they're always read and written together with the task. A separate table would mean a JOIN on every task fetch. JSONB keeps it simple and the access pattern fits perfectly.

**ai_generated flag** — This lets me show users which tasks came from AI vs ones they created manually. It's also useful for the presentation — I can filter and show "AI-created tasks" specifically.

**updated_at trigger** — There's a PostgreSQL trigger that automatically updates `updated_at` on every row change. No application code needed for this.

**Indexes**

```sql
idx_tasks_user_id   -- every query filters by user_id first
idx_tasks_status    -- filtering by status is common
idx_tasks_priority  -- filtering by priority is common
```

---

## Authentication flow

```
Registration:
User fills form → POST /api/auth/register
  → supabaseAdmin.auth.admin.createUser()
  → User stored in Supabase Auth
  → Auto sign-in via NextAuth credentials
  → JWT issued, stored in httpOnly cookie
  → Redirect to /dashboard

Login:
User fills form → NextAuth signIn('credentials')
  → authorize() calls supabaseAdmin.auth.signInWithPassword()
  → Supabase verifies password hash
  → Returns user object
  → NextAuth issues JWT with user.id embedded
  → Stored in httpOnly cookie
  → Redirect to /dashboard

Every protected request:
API route or Server Component calls auth()
  → Reads JWT from httpOnly cookie
  → Verifies signature with NEXTAUTH_SECRET
  → Returns session with user.id
  → If no valid session → 401 or redirect to /auth/login
```

**Why httpOnly cookies and not localStorage?**

localStorage is accessible to any JavaScript on the page. If there's an XSS vulnerability anywhere, an attacker can steal the token. httpOnly cookies can't be read by JavaScript at all — only sent by the browser automatically with each request. It's a meaningful security improvement with zero downside for this use case.

---

## API design

All endpoints follow REST conventions. Resources are nouns, HTTP verbs do the work.

```
GET    /api/tasks              list tasks (with query param filters)
POST   /api/tasks              create task
PATCH  /api/tasks/:id          update task fields
DELETE /api/tasks/:id          delete task
POST   /api/auth/register      create account
POST   /api/ai                 all AI features (action param routes internally)
```

I put all AI features behind a single `/api/ai` route with an `action` parameter instead of separate routes. The reasoning: all three features (breakdown, priority, natural-language) share the same auth check, the same error handling shape, and the same response format. One route, one place to maintain.

**Ownership verification on mutations**

Before any PATCH or DELETE, I verify the task belongs to the current user:

```typescript
const { data: existing } = await supabaseAdmin
   .from('tasks')
   .select('user_id')
   .eq('id', id)
   .single();

if (!existing || existing.user_id !== session.user.id) {
   return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

I return 404 instead of 403 intentionally. If I returned 403, an attacker would know the resource exists. 404 reveals nothing.

---

## AI integration

Three features, all in `src/lib/anthropic.ts`:

**breakdownTask(title, description)**
Takes a task title and breaks it into 3-6 actionable subtasks with time estimates. The prompt is structured to return only JSON — no preamble, no explanation. I strip any markdown code fences before parsing and wrap everything in try/catch so a malformed response never crashes the endpoint.

**suggestPriority(title, description)**
Returns a priority level (low/medium/high) and estimated minutes. Kept deliberately simple — the prompt is short, max_tokens is 200, response time is fast.

**createTasksFromNaturalLanguage(input)**
The most complex one. Takes free-form text and generates 1-4 structured tasks with subtasks, categories, and priorities. This is what makes the app interesting to demo — you type a paragraph and get back a full task structure.

**Prompt engineering decisions**

Every prompt ends with explicit instructions about the response format. I specify the exact JSON structure I want, including field names and allowed values. For priority I say `"must be exactly one of: low, medium, high"` — this prevents Claude from returning "High Priority" or "MEDIUM" which would break the TypeScript types.

**Fallback handling**

If Claude's API is down or returns something unparseable, every function returns a safe default:

- breakdown → empty subtasks array
- priority → 'medium'
- natural-language → empty tasks array

The UI shows a friendly error message. The app never crashes.

---

## State management approach

The dashboard (`/dashboard/page.tsx`) is a Server Component. It fetches the initial task list on the server and passes it to `TaskList` as a prop. After that, `TaskList` owns the state client-side.

Why not use React Query or SWR? Because the access pattern is simple — initial load, then mutations that I control. I know exactly when data changes because I'm the one changing it. I update the local state optimistically after each API call. There's no need for polling or background refetching.

The stats counters (Total, To Do, In Progress, Done) are derived from the local tasks state using `useMemo`. This is why they update instantly — they're computed values, not separate data fetches.

---

## Trade-offs I made consciously

**No optimistic updates with rollback**
When a task is created, I wait for the API response before updating the UI. Proper optimistic updates would update immediately and roll back on failure. I chose not to implement this because the API is fast enough that the delay isn't noticeable, and rollback logic adds complexity that's hard to test in 48 hours.

**No real-time sync**
If you have two browser tabs open, creating a task in one doesn't appear in the other without refresh. Supabase Realtime would solve this but it's not worth the added complexity for a task manager where you're unlikely to have multiple sessions.

**No pagination**
All tasks load at once. For a demo this is fine. In production with thousands of tasks, I'd add cursor-based pagination on the API and virtualized rendering on the client.

**Email verification skipped**
I disabled email verification in Supabase for ease of testing. In production this would be enabled — you don't want anyone registering with someone else's email.

---

## What I'd do differently with more time

1. **Add React Query** for server state management — automatic background refetching, better loading states, proper cache invalidation
2. **Add E2E tests with Cypress** — at minimum, test the full auth flow and task CRUD
3. **Add rate limiting on AI endpoints** — right now anyone with a valid session can hammer the Claude API
4. **Implement optimistic updates** — update UI immediately, roll back on API failure
5. **Add due date notifications** — tasks with approaching due dates should surface prominently
6. **Proper error boundaries** — right now a React error in a component crashes the whole page
