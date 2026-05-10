# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (localhost:5173)
npm run build      # production build — always run before committing to verify
npm run lint       # ESLint check
npm run preview    # preview production build locally
```

No test suite exists yet.

## Environment

Requires a `.env` file at the root (copy from `.env.example`):
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

RLS is **disabled** on all Supabase tables (deliberate — see `supabase/schema.sql` for the policy definitions that exist but are not enforced). Do not re-enable without testing thoroughly; prior attempts caused 403s due to `auth.uid()` not resolving correctly inside `security definer` functions.

## Architecture

**Stack:** Vite + React 19, Tailwind CSS v3, TanStack Query v5, React Router v7, react-i18next, Supabase JS v2.

### Data flow
All Supabase calls live in `src/hooks/`. Pages never call `supabase` directly — they use hooks. TanStack Query handles caching and invalidation; mutations invalidate their relevant query keys on success.

### Key hooks
| Hook | Responsibility |
|---|---|
| `useAuth` | Supabase auth session, wraps `onAuthStateChange` |
| `useHousehold` | List/create households |
| `useMembers` / `useCurrentMember` | Members within the active household |
| `useTasks` / `useCompleteTask` | Task CRUD + completion (credits points to member) |
| `useRewards` / `useRedeemReward` | Reward CRUD + redemption (debits points) |
| `useInvites` / `useAcceptInvite` | Token-based invite link generation and acceptance |
| `useMemberActivity` | Per-member completion + redemption history |

### State management
- **Active household** — `HouseholdContext` (persisted to `localStorage`). All data queries are scoped to `activeHouseholdId`.
- **Theme + dark mode** — `ThemeContext` (persisted to `localStorage`). Applies CSS classes (`theme-ocean`, `theme-forest`, `dark`) to `document.documentElement`.
- **Auth user** — returned directly from `useAuth`, not stored in context.

### Points system
Points are stored as `points_balance` on `household_members`. Completing a task increments it; redeeming a reward decrements it. Both operations are done client-side in two sequential Supabase calls (fetch balance → update balance). There is no server-side transaction.

### i18n
All UI strings are in `src/i18n/locales/en.json` and `es.json`. Language is detected from `localStorage` then browser. Add new strings to both files — keys are nested (e.g. `tasks.categories.cleaning`).

### Theming
Three color themes defined via CSS custom properties in `src/index.css`: **purple** (default, no class), **ocean** (`.theme-ocean`), **forest** (`.theme-forest`). Each has a `.dark` variant. The primary color variable (`--primary`) drives all branded UI elements via Tailwind's `bg-primary`, `text-primary`, etc.

### Routing
`/auth` — public. `/join/:token` — public (invite acceptance, contains its own auth form). All other routes require auth and render inside `<Layout>` (sidebar + header). If a user has no household, they are redirected to `/households` after signup.

### Database
Schema lives in `supabase/schema.sql`. Key tables: `households`, `household_members` (points, avatar, email, emoji), `tasks` (bilingual: `name_en`/`name_es`), `task_completions` (`completed_at` is user-specified, not auto-set), `rewards`, `reward_redemptions`, `household_invites` (token, 7-day expiry, single-use). Task templates are rows in `tasks` where `household_id IS NULL` and `is_template = true`.

### AvatarCircle
Defined and exported from `MembersPage.jsx` (not a standalone component file). Imported by `DashboardPage`. Renders an emoji if `avatarEmoji` prop is set, otherwise falls back to a colored circle with the first letter.
