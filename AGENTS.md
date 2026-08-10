<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!--
  Everything below is project content and is SAFE from `next dev`.
  It rewrites only the block between the BEGIN/END markers above — see
  upsertAgentRulesBlock in node_modules/next/dist/server/lib/generate-agent-files.js.
-->

# AGENTS.md — careeros-web

Canonical brief for any coding agent working in this repo. Codex reads this file
directly; `CLAUDE.md` imports it so Claude Code reads the same content. **Edit this
file, never `CLAUDE.md`.**

## Part of CareerOS

| Repo | Owns |
| --- | --- |
| [careeros](https://github.com/Himansh97/careeros) | Candidate data, docs, **`docs/STATE.md` — current state, read it first** |
| [careeros-api](https://github.com/Himansh97/careeros-api) | FastAPI backend on :8000 |
| **careeros-web** (this one) | Next.js 16 frontend, 19 routes |

## Non-negotiables

1. **Nothing auto-submits.** Buttons prepare and stage; the user applies. Copy must never
   imply the app sent something — "Open application" and "Mark as applied", never
   "Approve & Submit".
2. **Never show mock data as if it were real.** `isLiveApi()` / `isMockData()` in
   `src/lib/api/client.ts` gate this. A disconnected backend must surface as a
   not-connected state, not as plausible-looking fake numbers.
3. **Report honestly what the backend actually did.** If search ranked a subset, say so —
   the jobs page prints "N of M scored" for exactly this reason.
4. **Never add a `Co-Authored-By: Claude` trailer to commits.**

## How to run it

```bash
npm run dev        # :3311
npm run lint       # eslint — must be clean
npx tsc --noEmit   # must be clean
```

`.env.local` holds `NEXT_PUBLIC_API_URL=http://localhost:8000` and
`NEXT_PUBLIC_USE_MOCK_DATA=false`. Start `careeros-api` first or every page shows its
not-connected state.

## Conventions that bite

- **React Compiler is on.** `setState` inside an effect is a lint *error*, not a warning.
  Seed derived state at the moment the user acts (e.g. when they click Edit) rather than
  syncing it from a prop in an effect.
- **`useSyncExternalStore`** for the store-backed pages (approvals, applications) — not
  effect-driven fetching. React calls `getSnapshot()` before `subscribe()`, so
  lazy-initialising a cache inside `getSnapshot` means the fetch never fires. The stores
  use an explicit `fetched` flag because of that exact bug.
- **shadcn/ui primitives need their roots.** `CommandDialog` rendered children straight
  into `DialogContent` without a `Command` root; every cmdk child pulls a store from that
  context, so ⌘K threw `Cannot read properties of undefined (reading 'subscribe')` and had
  never once worked.
- **Shared actions belong in a hook.** "Tailor Resume" and "Prepare Application" exist on
  both the job detail page and the split-pane panel; they drifted apart as stubs once
  already. `src/lib/hooks/use-tailoring.ts` is the single source.
- Hooks must be named `useX`. Plain predicates like `isLiveApi` must not be.

## Verification

`npm run lint` and `npx tsc --noEmit` both clean before anything is called done. Then
click the actual flow — several bugs here (the command palette, the tailor buttons, the
empty approvals page) type-checked and linted perfectly while being completely broken at
runtime.
