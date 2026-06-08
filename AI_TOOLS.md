# AI Tools

## Tools Used

### Claude Code (VS Code Extension)
Primary coding assistant throughout the project. Used for implementing features, refactoring, debugging, and the full dark theme migration. All code in this repository was written or reviewed with Claude Code assistance.

### Claude.ai (claude-sonnet-4-5)
Used for architecture planning, thinking through trade-offs, and drafting documentation before implementation.

### Anthropic Claude API
Powers all three AI features built into the app:
- **Natural language task creation** — converts free-text descriptions into structured tasks with subtasks, priority, and category
- **Task breakdown** — splits a task title into 3–6 actionable subtasks with time estimates
- **Priority suggestion** — analyses task title and description, returns a priority level and estimated duration

---

## Examples of Effective AI Assistance

**Supabase schema and RLS policies**
Generated the complete table schema with correct column types, constraints, and Row Level Security policies. The RLS policy ensuring users only access their own rows (`user_id = auth.uid()`) was produced correctly on the first attempt.

**Anthropic prompt functions**
Built all three prompt functions in `src/lib/anthropic.ts` — including the JSON-only response instructions, strip-markdown parsing, and typed return values — in a single pass with no manual edits needed.

**Dark theme migration**
Migrated 20+ files from Tailwind light classes (`bg-white`, `text-gray-900`, `border-gray-200`, etc.) to the custom dark palette (`bg-dark-card`, `text-content-primary`, `border-dark-border`) in one structured pass, handling every variant and hover state correctly.

**NextAuth v5 session callback bug**
Identified and fixed a session callback that was not forwarding the `user.id` field, which caused all authenticated API routes to return 401. The fix required understanding NextAuth v5's changed callback signature compared to v4.

**Hydration error with RandomQuote**
Diagnosed why `Math.random()` inside a `useState` initialiser caused a server/client mismatch. Extracted the logic into a dedicated `RandomQuote` client component that defers the random pick to a `useEffect`, eliminating the mismatch without changing any parent component.

---

## Where I Overrode AI Suggestions

**Subtasks as JSONB, not a separate table**
AI suggested a normalised `subtasks` table with a foreign key. I kept subtasks as a JSONB column on the `tasks` table because subtasks are always fetched with their parent task and never queried independently — a join would add latency with no benefit.

**Replacing `any` types with proper TypeScript**
AI-generated code frequently used `any` for event handlers, API responses, and callback parameters. I replaced all of them with explicit types to pass the CI lint checks and catch real bugs earlier.

**Separate API routes for tasks and AI**
AI suggested consolidating `/api/tasks` and `/api/ai` into a single route handler. I kept them separate — tasks is a standard CRUD resource, AI is a stateless action endpoint. Mixing them would blur responsibility and make error handling harder.

**Specific HTTP status codes and error messages**
AI defaulted to generic `{ error: 'Something went wrong' }` with 500 status on most failures. I replaced these with correct codes (400 for validation, 401 for auth, 404 for not found, 503 for AI unavailable) and messages that help the client distinguish failure modes.

**httpOnly cookies instead of localStorage for auth**
AI's initial auth scaffolding stored the session token in localStorage. I enforced NextAuth's default httpOnly cookie storage, which keeps tokens out of JavaScript scope and prevents XSS-based session theft.

---

## Effectiveness and Limitations

**Effective for:**
- Boilerplate that follows a clear pattern (CRUD routes, form components, schema definitions)
- Repetitive cross-file changes (theme migrations, type replacements)
- Explaining error messages and suggesting fixes during debugging
- Generating structured JSON prompt templates for the Claude API integration

**Requires human judgment for:**
- Database schema decisions where trade-offs depend on query patterns
- Authentication security choices — AI defaults are not always secure
- Deciding what belongs in which layer (client vs. server, separate vs. combined routes)
- Catching hallucinated API signatures, especially for libraries in active development like NextAuth v5

**Review process:**
Every AI-generated change was read before being committed. TypeScript strict mode and the GitHub Actions lint/typecheck pipeline caught several type errors introduced by AI output that were not obvious from a quick visual scan.
