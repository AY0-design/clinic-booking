const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

export type Slot = { id: string; provider: string; start: string; end: string; available: boolean };
export type Booking = {
  id: string;
  slot_id: string;
  name: string;
  email: string;
  status: "confirmed" | "cancelled";
  created_at: string;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { "X-API-Key": KEY, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const ra = Number(res.headers.get("Retry-After"));
    throw new ApiError(res.status, body.error ?? "Something went wrong", ra || undefined);
  }
  return body as T;
}

export const getSlots = () => call<{ slots: Slot[] }>("/slots").then((r) => r.slots);

// LOOM the caller passes in the Idempotency-Key. page.tsx makes a
// new one per booking attempt and reuses it on retries, so a double click or a
// dropped connection can't create two bookings.
export const createBooking = (
  input: { slot_id: string; name: string; email: string },
  idempotencyKey: string,
) =>
  call<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "Idempotency-Key": idempotencyKey },
  });

export const listBookings = (email: string, cursor?: string | null) =>
  call<{ bookings: Booking[]; next_cursor: string | null }>(
    `/bookings?email=${encodeURIComponent(email)}&limit=10${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
  );

export const cancelBooking = (id: string) =>
  call<Booking>(`/bookings/${encodeURIComponent(id)}`, { method: "DELETE" });
