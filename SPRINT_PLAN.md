# AI Task Manager — Development Journal

This document tracks the development progression of the AI Task Manager — what was built in each sprint, key decisions made, and bugs encountered and resolved.

---

## Sprint 0 — Foundation

**Goal:** Scaffold the project and establish the full technical foundation before writing any feature code.

### What was built

- Next.js 16 project with TypeScript and Tailwind CSS v3
- All dependencies installed: Supabase client, NextAuth v5, Anthropic SDK, Lucide React
- Supabase project provisioned — PostgreSQL schema created, Row Level Security enabled
- Environment variable structure defined (`.env.local` + `.env.example`)
- Folder structure for App Router: `src/app/`, `src/components/`, `src/lib/`, `src/types/`
- Core library files: `supabase.ts`, `auth.ts`, `anthropic.ts`
- All API route handlers: auth (login + register), tasks (CRUD), AI endpoint
- All page components: landing, login, register, dashboard, dashboard layout with navbar
- All task components: `TaskList`, `TaskCard`, `TaskForm`, `AiAssistant`

### Key decisions

- Used `supabaseAdmin` (service role key) in API routes to bypass RLS for writes — RLS still protects reads via `user_id` filtering
- NextAuth JWT strategy instead of database sessions to avoid an extra table
- All AI features routed through a single `/api/ai` endpoint with an `action` discriminator (`natural`, `breakdown`, `priority`) rather than three separate routes

### Bugs encountered

None at scaffold stage — issues surfaced during integration testing in Sprint 1.

---

## Sprint 1 — Integration and Bug Fixes

**Goal:** Wire everything together end-to-end and fix integration bugs.

### What was fixed

- NextAuth session not propagating `user.id` to JWT — fixed by adding `id` to the session callback in `auth.ts`
- Task API routes returning 401 when session existed — caused by missing `getServerSession` import; fixed by importing from the correct NextAuth path for App Router
- Register flow not auto-signing in after account creation — `signIn('credentials')` call added after successful registration response
- Dashboard redirecting to login even when authenticated — middleware matcher was too broad; scoped to `/dashboard` only

### Auth flow confirmed working

- Register → auto sign-in → dashboard
- Login → dashboard
- Sign out → home page
- Unauthenticated `/dashboard` → redirect to login
- User A cannot access User B's tasks (verified via RLS)

### Git commits

```
feat: initial AI task manager implementation
fix: session callback missing user id in NextAuth config
fix: task API 401 on authenticated requests
```

---

## Sprint 2 — UI Polish and Dark Theme

**Goal:** Replace the default Next.js styling with a consistent professional dark aesthetic.

### What was built

- Custom Tailwind color palette in `tailwind.config.js`:
  - `dark.*` — page, card, hover, border, border2
  - `content.*` — primary, secondary, muted
  - `accent.*` — cyan, blue, purple, green, amber, red
- Full `globals.css` rewrite: dark body, base styles for `input`/`textarea`/`select`, custom scrollbar, webkit-autofill override
- Replaced all `gray-*` and `white` Tailwind classes across every component with custom palette equivalents
- Replaced emoji icons with Lucide React icons throughout (`CheckSquare`, `Bot`, `Target`, `MessageSquare`, `Sparkles`, `Wrench`)
- Dashboard hero: two-column layout with welcome text + quote on left, status carousel on right
- Status carousel: tab navigation (`In Progress` / `To Do` / `Done`) with arrow controls and fixed-height scrollable task list

### Key decisions

- Webkit-autofill required `box-shadow: 0 0 0 1000px #141414 inset` — background-color alone is ignored by Chrome's autofill override
- The carousel scroll required `min-h-0` on the `flex-1 overflow-y-auto` child — without it, a flex child cannot shrink below its content height and overflow never activates
- `RandomQuote` extracted to a separate client component to avoid React hydration mismatch (`Math.random()` cannot run in a server-rendered `useState` initializer)

### Bugs encountered and fixed

- **Hydration error:** `useState(() => QUOTES[Math.floor(Math.random()...)])` produces different values on server and client, causing React to throw. Fixed by moving to a `useEffect` inside a `'use client'` component.
- **Carousel not scrolling:** `flex-1 overflow-y-auto` without `min-h-0` does not scroll. Fixed by adding `min-h-0` to the task list container.
- **TaskCard border invisible:** Card had `border` without a color class — defaulted to browser color. Fixed: `border border-dark-border`.

### Git commits

```
feat: dark theme — custom Tailwind palette and globals.css overhaul
feat: dashboard hero with two-column layout and status carousel
fix: hydration error — extract RandomQuote to client component
fix: carousel scroll requires min-h-0 on flex child
fix: TaskCard missing border color
```

---

## Sprint 3 — AI Feature Polish

**Goal:** Make all three AI features reliable and clearly presented in the UI.

### What was built

- `AiAssistant` component redesigned with tab-based navigation between `Natural Language` and `Task Breakdown` modes
- Structured JSON prompts for all three Claude calls — natural task creation, breakdown into subtasks, priority + time estimation
- Result preview cards before task creation (user can see what Claude suggests before committing)
- Loading states and error handling on all AI API calls
- `AiAssistant` uses `accent-purple` theming to visually distinguish it from the task management UI

### Key decisions

- Claude model pinned to `claude-sonnet-4-5` — good balance of speed and structured JSON reliability
- All prompts instruct Claude to respond with JSON only, no prose — reduces parse failures
- AI panel and task form are mutually exclusive — opening one closes the other

### Bugs encountered and fixed

- **AI panel and task form open simultaneously:** No mutual exclusion in button handlers. Fixed by adding `setShowForm(false)` when opening AI panel and vice versa.

### Git commits

```
feat: AI assistant panel with natural language and breakdown tabs
fix: close AI panel when opening task form and vice versa
```

---

## Sprint 4 — Feedback and Notifications

**Goal:** Add user feedback for all async operations.

### What was built

- `react-hot-toast` integrated — `<Toaster>` placed in `dashboard/layout.tsx` with dark theme options
- `toast.success()` and `toast.error()` calls in all three task handlers (`handleCreate`, `handleUpdate`, `handleDelete`)
- Delete confirmation via `confirm()` dialog before proceeding
- `Loader2` spinner (Lucide) in login, register, and task form submit buttons during loading states

### Bugs encountered and fixed

- **TypeScript `any` type in tab handler:** `tabIndex` setter used implicit `any`. Fixed with explicit `(i: number)` parameter type.
- **Default tab state not initialised:** Carousel defaulted to undefined tab on first render. Fixed by initialising `tabIndex` to `0`.

### Git commits

```
feat: toast notifications for task create, update, delete
feat: loading spinners on all async submit buttons
feat: delete confirmation before task removal
fix: remove any type in tab handler, add default tab state
```

---

## Sprint 5 — CI/CD and Deployment

**Goal:** Set up automated quality checks and deploy to production.

### What was built

- GitHub Actions workflow: typecheck (`tsc --noEmit`) and ESLint on every push to `master`
- Deployed to Vercel — automatic deploys triggered on push after CI passes
- All environment variables configured in Vercel project settings
- Supabase allowed redirect URLs updated to include the Vercel production URL

### Key decisions

- CI runs typecheck and lint as separate steps so failures are identifiable
- `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` use the Vercel URL in production, `http://localhost:3000` in development

### Bugs encountered and fixed

- **CI lint failing on `any` types:** Several components had implicit `any` from event handlers. Replaced with explicit TypeScript types throughout to pass the lint gate.

### Git commits

```
chore: GitHub Actions CI — typecheck and lint on every push
fix: replace any types with proper TypeScript types for CI lint pass
feat: Vercel deployment with environment variables
```

---

## Sprint 6 — Documentation

**Goal:** Write public-facing documentation for the repository.

### What was written

- `README.md` — live demo URL, features, tech stack with rationale, local setup steps, deployment guide, CI/CD explanation, environment variable reference
- `AI_TOOLS.md` — tools used during development (Claude Code VS Code extension, Claude.ai, Anthropic API), effective usage examples, cases where AI suggestions were overridden and why, honest assessment of effectiveness and limitations

---

## Summary

| Sprint   | What                                         | Outcome                          |
| -------- | -------------------------------------------- | -------------------------------- |
| Sprint 0 | Project scaffold and foundation              | Full codebase structure in place |
| Sprint 1 | End-to-end integration and auth bug fixes    | All flows working                |
| Sprint 2 | Dark theme, dashboard layout, carousel       | Consistent visual design         |
| Sprint 3 | AI feature polish and mutual exclusion fixes | All three AI features working    |
| Sprint 4 | Toast notifications and loading states       | Full async feedback loop         |
| Sprint 5 | GitHub Actions CI and Vercel deployment      | Live production URL              |
| Sprint 6 | README and AI_TOOLS documentation            | Repository ready for submission  |
