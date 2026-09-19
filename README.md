# Stubby

Study planning for students who procrastinate. Give Stubby your schedule, your
extracurriculars, and your upcoming tests — Stubby finds the free time and
picks the study session for you. No deciding when to study. Just a time, and
a "GO STUDY" button.

## Stack

- **Client**: React 19 + TypeScript + Vite, Tailwind CSS v4, React Router,
  Zustand (toasts), Recharts (stats charts), lucide-react (icons).
- **Server**: Node + Express, SQLite via `better-sqlite3` (file-based, zero
  setup), JWT auth (`jsonwebtoken` + `bcryptjs`).

Everything is plain JS/TS with no build-heavy framework — chosen so the app
runs anywhere with just Node installed, no external database or services
required for the MVP.

## Running it locally

Two processes, two terminals:

```bash
# Terminal 1 — API (http://localhost:4000)
cd server
cp .env.example .env   # then edit JWT_SECRET to something random
npm install
npm run dev

# Terminal 2 — Web app (http://localhost:5173)
cd client
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to `http://localhost:4000`, so just open
`http://localhost:5173`.

To run the scheduling-algorithm test suite:

```bash
cd server
npm test
```

## How the scheduling algorithm works

Source: `server/scheduler.js` (pure functions, unit tested in
`server/scheduler.test.js`).

1. **Free time.** For a given day, all schedule events (school, sports,
   work, etc. — recurring events are expanded onto that date) and any
   already-planned study sessions are merged into "busy" intervals inside
   the student's wake–sleep window. Free time = window minus busy.
2. **Valid slots.** Every legal placement of a study session (stepping in
   15-minute increments through each free interval) is enumerated — not
   just one arbitrary spot. This is what "Stubby chooses randomly among
   real options" means concretely.
3. **Random pick.** One of those valid slots is chosen at random and
   inserted as a `study_session` row. "Randomize Again" recomputes the
   free/valid slots fresh (excluding the session being replaced) and picks
   again, actively avoiding the slot just shown when alternatives exist.
4. **Prioritization.** When multiple tests are active, each gets a score
   from how soon it is, its difficulty, its requested daily study time, and
   how many sessions have already been completed toward it. `POST
   /api/sessions/generate` walks tests highest-score first and greedily
   places one session per test into whatever free time remains, so the
   test due tomorrow gets first claim on the day.

## Environment variables / API keys

None are required to run the MVP end to end. For production you'd want to
set, in `server/.env`:

- `JWT_SECRET` — required, long random string (there's a dev default, don't
  ship it).
- `PORT` — optional, defaults to 4000.

Two integration points are architected but intentionally stubbed, with
comments at the connection point in the code:

- **Payments** (`server/routes/premium.js`) — Stubby+ ($5 lifetime) currently
  flips a flag directly so the full premium experience can be tested without
  credentials. Swap in Stripe Checkout (`STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`) per the comment in that file.
- **Ads** (`client/src/components/AdSlot.tsx`) — renders a labeled dev
  placeholder, never shown to Stubby+ users, never placed on the study timer
  or anywhere it could block starting a session. Swap in a real ad
  network's unit component per the comment in that file.

## Data model

SQLite tables (`server/db.js`): `users`, `schedule_events`, `tests`,
`study_sessions`. Every query is scoped by `user_id`, so one student can
never read or write another's data. Statistics (`server/routes/stats.js`)
are computed on the fly from `study_sessions`, not stored redundantly.

## Known MVP limitations

- Stats and ad placement are wired for a single ad network / payment
  processor pattern, not a live one — see the integration points above.
- No push notifications yet; the "GO STUDY" reminder is the in-app dashboard
  card + countdown, not an OS-level notification. The architecture (a single
  `study_sessions` row with a known start time) is ready for a notifications
  layer to hook into.
- No password reset / email verification flow.
- The scheduler works one day at a time (today, or a date you pass in) —
  there's no multi-week forward planner yet, matching the MVP's "decide for
  right now" philosophy.
