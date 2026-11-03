// Replaces all slots with fresh ones starting tomorrow (UTC), so the booking
// page never runs out of upcoming appointments. This also deletes bookings.
//
//   API_URL=https://... API_KEY=... node scripts/seed.js [days]
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;
const DAYS = Number(process.argv[2]) || 7;
const PROVIDERS = ['Dr Ade', 'Dr Bello'];
const HOURS_UTC = [9, 10, 11, 14];
const SLOT_MINUTES = 30;

if (!API_URL || !API_KEY) {
  console.error('Set API_URL and API_KEY.');
  process.exit(1);
}

const today = new Date();
today.setUTCHours(0, 0, 0, 0);

const slots = [];
for (let d = 1; d <= DAYS; d++) {
  for (const provider of PROVIDERS) {
    for (const hour of HOURS_UTC) {
      const start = new Date(today.getTime() + d * 86400000 + hour * 3600000);
      const end = new Date(start.getTime() + SLOT_MINUTES * 60000);
      slots.push({ id: `s${slots.length + 1}`, provider, start: start.toISOString(), end: end.toISOString() });
    }
  }
}

(async () => {
  const res = await fetch(`${API_URL}/reset`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ slots }),
  });
  console.log(res.status, await res.text());
  console.log(`${slots[0].start} -> ${slots[slots.length - 1].start}`);
  if (!res.ok) process.exit(1);
})();
