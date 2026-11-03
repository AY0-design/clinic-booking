# Mayday booking UI

The booking front end for the clinic API. Built with Next.js (App Router) and [Spiral UI](https://github.com/AY0-design/Spiral_UI), from the Mayday Figma design.

Live: https://mayday-booking-ui.vercel.app

## Run it

```bash
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_API_KEY
npm install
npm run dev
```

Open http://localhost:3000. Check it with `npm run lint` and `npm run build`.

## Where things are

| Path | What it holds |
|---|---|
| `src/lib/api.ts` | The only code that talks to the API. |
| `src/lib/dates.ts` | Date and time labels such as "30th, Oct 2026". |
| `src/app/page.tsx` | The booking flow: Time, Details, Confirmation. |
| `src/components/` | One component per screen, plus the header and records drawer. |

## Notes

- Bookings send an `Idempotency-Key` that is created once per attempt, so a double click or a retry can't book twice.
- Two pieces are local because Spiral UI doesn't cover what the design needs: the progress bar (Spiral's `StepIndicator` highlights only the current step) and the blurred backdrop behind the records drawer.
- The API key is public in the browser. Use a key you can rotate.
