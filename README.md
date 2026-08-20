# careeros-web

> **Part of CareerOS** — [careeros-api](https://github.com/Himansh97/careeros-api) (backend) · **careeros-web** (frontend)

Frontend for CareerOS. Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui.
27 routes over one pipeline: discovery, fit breakdowns, in-app resume editing,
approvals, recruiter messages, outreach and interview practice.

## Three rules this is built around

**Nothing auto-submits.** Buttons prepare and stage; the person applies. The copy
is held to this too — "Open application" and "Mark as applied", never "Approve &
Submit". The backend is structurally incapable of pressing submit, and the UI must
never imply otherwise.

**Never show mock data as if it were real.** `isLiveApi()` and `isMockData()` in
`src/lib/api/client.ts` gate every query. A backend that is down surfaces as an
explicit not-connected state, never as plausible-looking zeros — because a
pipeline that reads "0 applications" when the API is unreachable is worse than one
that reads "cannot reach the API".

**Report honestly what the backend actually did.** If search scored a subset of
matches, the page says "N of M scored" rather than presenting a partial ranking as
a complete one.

## Notable

- **`apiFetch` never throws.** It returns a discriminated union — `{ok: true, data}`
  or `{ok: false, reason}` — because a disconnected backend is a normal state in a
  local-first tool, not an exception.
- **The React Compiler is on**, which makes `setState` inside an effect a lint
  error. Continuous animation is driven by framer-motion `MotionValue`s off the
  React render path, and values that live outside React are read through
  `useSyncExternalStore`.
- **Reduced motion is a hard requirement.** `globals.css` neutralises CSS
  transitions globally, so anything that animates has to degrade to a static state
  rather than a slower one.
- The palette is the 1975 NASA Graphics Standards Manual; interview readiness is
  presented as a launch poll, reading GO / HOLD / NO-GO per competency.

## Running it

```bash
npm install
npm run dev        # :3311
```

`.env.local` holds `NEXT_PUBLIC_API_URL=http://localhost:8000`. Start
[careeros-api](https://github.com/Himansh97/careeros-api) first, or every page
shows its not-connected state — which is the honest thing for it to do.

```bash
npm run lint       # must be clean
npx tsc --noEmit   # must be clean
```

Both clean is the bar before anything is called done, and then the flow gets
clicked — several bugs here type-checked and linted perfectly while being
completely broken at runtime.

## Data

The candidate's own data lives in a separate private repository. Nothing personal
is committed here.
