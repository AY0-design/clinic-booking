# Clinic Booking

A booking system for a clinic: patients see open appointment slots, book one, and get a confirmation. They can look up and cancel their bookings later.

It has three parts:

| Part | What it is | Where |
|---|---|---|
| **API** | JSON API on Node, Express and Postgres. Implements levels 1–5 of the Koya assessment spec. | repo root (`src/`, `api/`) |
| **Original web page** | Single HTML page the API serves at `/`. | `web/` |
| **Mayday booking UI** | Next.js app built with [Spiral UI](https://github.com/AY0-design/Spiral_UI) from the Mayday Figma design. | `ui/` |

## Live

| | URL |
|---|---|
| Mayday booking UI | https://mayday-booking-ui.vercel.app |

runs on Vercel. Bookings are stored in a Neon Postgres database.

## What the API does

Every request needs an `X-API-Key` header. A missing or wrong key returns `401`. Errors always look like `{"error": "<message>"}`.

| Endpoint | Purpose |
|---|---|
| `POST /reset` | Replace all slots and delete every booking. |
| `GET /slots` | List slots, earliest first. Filter with `?provider=`. Each slot has `available`. |
| `POST /bookings` | Book a slot. Returns `201` with the booking. |
| `GET /bookings?email=` | List one person's bookings, oldest first, with cursor paging (`limit`, `cursor`). |
| `GET /bookings/{id}` | Look up one booking. |
| `DELETE /bookings/{id}` | Cancel a booking and free its slot. |

Full contract: https://koyaacademy.com/assessment-api

### How each level works

| Level | Requirement | How it is built |
|---|---|---|
| 1 | List slots, book one, look up a booking. | Plain REST handlers over Postgres. |
| 2 | API key, and valid input only. | Middleware checks the key in constant time before anything else. Name and email are trimmed and the email is lowercased. Missing or invalid fields return `400`, an unknown slot `404`, and a slot that already started `400`. |
| 3 | No double booking, even at the same moment. Cancellation. | A partial unique index, `UNIQUE (slot_id) WHERE status = 'confirmed'`. The database lets one request win and returns `409` to the rest. Cancelling is one atomic update, so a second cancel returns `409`. |
| 4 | Retries never duplicate. Paging through bookings. | With an `Idempotency-Key`, the booking runs in one transaction behind an advisory lock on that key. The first response is stored with a hash of the request and replayed on retries. The same key with a different body returns `422`. Paging uses a cursor on an increasing sequence number. |
| 5 | Stop booking spam. | Every attempt for an email is recorded, including failed ones. The 6th attempt in 60 seconds returns `429` with `Retry-After`. The count and the insert happen under a lock on the email, so a burst can't slip through. Replays of an idempotent request are not counted. |

## The Mayday booking UI

The UI in `ui/` follows the Mayday Figma design across four screens:

1. **Time.** Pick a day, optionally filter by provider, then pick a time. One chip per time. It shows "N spot left" when several providers are free, or the provider's name when only one is.
2. **Details.** First name, last name and email, with inline validation.
3. **Confirmation.** The booking summary, a copy button for the confirmation ID, **Add to calendar** (downloads an `.ics` file), **Book another**, and **Cancel booking**.
4. **My records.** A drawer where you enter your email to see your bookings, cancel one, or load more.

Details worth knowing:

- Each booking attempt sends a fresh `Idempotency-Key`, so a double click or a retry after a dropped connection can't book twice.
- Spiral UI supplies the buttons (32px, Small), inputs, drawer, badges and icons. Two small pieces are local because the design needs something Spiral doesn't offer: the progress bar and the blurred drawer backdrop.
- Motion is short and uses transform and opacity. It switches to a plain fade when the visitor asks for reduced motion.
- The API key is sent from the browser, so anyone can see it in the page. That is the trade-off of calling a key-protected API without a server in between.

## Run it locally

You need Node 18 or newer and a Postgres database.

### API

```bash
export DATABASE_URL=postgres://user:password@localhost:5432/clinic
export API_KEY=choose-a-long-random-string
npm install
npm start
```

The tables are created on first start. Load fresh slots (the next 7 days by default) with:

```bash
API_URL=http://localhost:3000 API_KEY=your-key node scripts/seed.js [days]
```

### Mayday booking UI

```bash
cd ui
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_API_KEY
npm install
npm run dev
```

Open http://localhost:3000.

## Tests

```bash
npm test
```

The tests start an embedded Postgres, so you don't need a database. They run the real server and check:

- the API key and input validation
- slot listing, booking, lookup and cancellation
- 40 simultaneous bookings of one slot (exactly one succeeds)
- idempotent retries, including concurrent ones, and the `422` case
- cursor paging and its limits
- the rate limit, including a concurrent burst

Check the UI with `npm run lint` and `npm run build` inside `ui/`.

## Deploy

Both projects deploy to Vercel as separate projects. The database is Neon Postgres.

| Project | Folder | Environment variables |
|---|---|---|
| API | repo root | `API_KEY`, `DATABASE_URL` |
| UI | `ui/` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_KEY` |

The API also deploys to any Node host, such as Render. `render.yaml` is included.

## Project layout

```
src/        API: routes (app.js), database and schema (db.js), server start
api/        Vercel serverless entry for the API
web/        Original HTML page, served by the API at /
test/       Integration tests
ui/         Mayday booking UI (Next.js + Spiral UI)
  src/app/          Page and layout
  src/components/   One component per screen
  src/lib/          API client and date helpers
```
