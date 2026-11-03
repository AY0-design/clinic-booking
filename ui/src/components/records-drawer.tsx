"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, Button, CompactButton, ContentDivider, Drawer, DrawerHeader, HintText, Icon, Input } from "spiral-ui";
import Information from "@mingcute/react/core-filled/information";
import More2 from "@mingcute/react/core-filled/more-2";
import { ApiError, cancelBooking, listBookings, type Booking, type Slot } from "@/lib/api";
import { whenLong } from "@/lib/dates";

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

type Props = { open: boolean; onClose: () => void; slots: Slot[]; initialEmail: string; onChanged: () => void; onCopied: () => void };

export function RecordsDrawer({ open, onClose, slots, initialEmail, onChanged, onCopied }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [active, setActive] = useState<string | null>(null); // email whose records are shown
  const [items, setItems] = useState<Booking[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current && initialEmail) setEmail(initialEmail);
    wasOpen.current = open;
  }, [open, initialEmail]);

  const load = async (target: string, more = false) => {
    setLoading(true);
    setError(null);
    try {
      const r = await listBookings(target, more ? cursor : null);
      setItems((prev) => (more ? [...prev, ...r.bookings] : r.bookings));
      setCursor(r.next_cursor);
      setActive(target);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load records");
    } finally {
      setLoading(false);
    }
  };

  const show = () => {
    const v = email.trim().toLowerCase();
    if (!EMAIL_RE.test(v)) return setError("Enter the email you used to book");
    load(v);
  };

  const cancel = async (id: string) => {
    setMenu(null);
    try {
      const updated = await cancelBooking(id);
      setItems((prev) => prev.map((b) => (b.id === id ? updated : b)));
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not cancel");
    }
  };

  const slotFor = (b: Booking) => slots.find((s) => s.id === b.slot_id);

  return (
    <>
    {/* Figma blurs the page behind the drawer; Spiral's Drawer overlay only dims it. */}
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-40 backdrop-blur-[4px] transition-opacity duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0"}`}
    />
    <Drawer
      open={open}
      onOpenChange={(o) => !o && onClose()}
      side="right"
      width={400}
      ariaLabel="My records"
      // Figma floats the drawer 20px inside the viewport with 20px corners.
      className={`top-5! right-5! h-[calc(100%-40px)]! rounded-[20px] ${open ? "" : "translate-x-[calc(100%+20px)]!"}`}
      header={
        active ? (
          <DrawerHeader title={`${active} records`} showCloseButton onClose={onClose} />
        ) : (
          <DrawerHeader title="My records" description="Use your booking email to see your appointments booking" showCloseButton onClose={onClose} />
        )
      }
    >
      {!active ? (
        <form
          className="flex flex-col gap-10 p-5"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            show();
          }}
        >
          <div className="flex flex-col gap-2">
            <Input
              size="sm"
              type="email"
              inputMode="email"
              autoComplete="email"
              aria-label="Email used to book"
              placeholder="you@example.com"
              value={email}
              error={!!error}
              onChange={(e) => setEmail(e.target.value)}
            />
            <HintText state={error ? "error" : "default"} icon={<Icon icon={Information} size={16} />}>
              {error ?? "The email address you used to book"}
            </HintText>
          </div>
          <div>
            <Button type="primary" style="filled" size="small" htmlType="submit" loading={loading}>
              Show records
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-5 p-5">
          {error && <p role="alert" className="text-[13px] text-[var(--ds-error-base)]">{error}</p>}
          {loading && !items.length && (
            <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading records">
              {[0, 1].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-5 w-56 animate-pulse rounded-[6px] bg-[var(--ds-bg-surface)]" />
                  <div className="h-5 w-72 animate-pulse rounded-[6px] bg-[var(--ds-bg-surface)]" />
                </div>
              ))}
            </div>
          )}
          {!items.length && !loading && !error && (
            <div className="enter rounded-[12px] bg-[var(--ds-bg-surface)] px-4 py-6 text-center">
              <p className="text-[14px] font-medium text-[var(--ds-text-strong)]">No bookings yet</p>
              <p className="mt-1 text-[13px] text-[var(--ds-text-soft)]">Nothing is booked under {active}. Check the spelling or book a time.</p>
            </div>
          )}
          {items.map((b, i) => {
            const s = slotFor(b);
            const confirmed = b.status === "confirmed";
            return (
              <div key={b.id} className="enter flex flex-col gap-5" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                {i > 0 && <ContentDivider lineType="dotted" />}
                <div className="relative flex items-start justify-between">
                  <div className="flex w-[320px] flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <p className="text-[13px] font-medium leading-5 tracking-[-0.065px] text-[var(--ds-text-strong)]">
                        {s ? whenLong(new Date(s.start)) : `Slot ${b.slot_id}`}
                      </p>
                      <Badge style="lighter" color={confirmed ? "green" : "red"}>
                        {confirmed ? "Confirmed" : "Cancelled"}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-[5px] text-[13px] leading-5 tracking-[-0.065px]">
                      <span className="text-[var(--ds-text-soft)]">ID:</span>
                      <button
                        type="button"
                        title="Copy confirmation ID"
                        onClick={() => navigator.clipboard.writeText(b.id).then(onCopied, () => {})}
                        className="truncate text-[var(--ds-text-sub)] underline decoration-solid underline-offset-2"
                      >
                        {b.id}
                      </button>
                    </p>
                  </div>
                  {confirmed && (
                    <div className="relative">
                      <CompactButton
                        icon={<Icon icon={More2} size={16} />}
                        style="ghost"
                        size="small"
                        aria-label="More actions"
                        aria-haspopup="menu"
                        aria-expanded={menu === b.id}
                        onClick={() => setMenu(menu === b.id ? null : b.id)}
                      />
                      {menu === b.id && (
                        <div
                          role="menu"
                          className="absolute right-0 top-6 z-10 w-40 rounded-[10px] border border-[var(--ds-stroke-soft)] bg-[var(--ds-bg-default)] p-1 shadow-[0_8px_18px_-4px_rgba(0,0,0,0.12)]"
                        >
                          <button
                            role="menuitem"
                            type="button"
                            onClick={() => cancel(b.id)}
                            className="w-full rounded-[6px] px-2 py-1.5 text-left text-[13px] text-[var(--ds-error-base)] transition-colors duration-150 hover:bg-[var(--ds-error-lighter)]"
                          >
                            Cancel booking
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div className="flex gap-3">
            {cursor && (
              <Button type="neutral" style="lighter" size="small" loading={loading} onClick={() => active && load(active, true)}>
                Load more
              </Button>
            )}
            <Button type="neutral" style="lighter" size="small" onClick={() => { setActive(null); setItems([]); setError(null); }}>
              Use another email
            </Button>
          </div>
        </div>
      )}
    </Drawer>
    </>
  );
}