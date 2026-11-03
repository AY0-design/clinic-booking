"use client";

import { useRef, useState } from "react";
import { Button, CompactButton, Icon } from "spiral-ui";
import Check2 from "@mingcute/react/core-filled/check-2";
import Copy2 from "@mingcute/react/core-regular/copy-2";
import type { Booking, Slot } from "@/lib/api";
import { clock, longDay } from "@/lib/dates";

type Props = {
  booking: Booking;
  slot: Slot | undefined;
  onCancel: () => Promise<void>;
  onBookAnother: () => void;
  onCopied: () => void;
};

function icsFor(b: Booking, s: Slot) {
  const z = (iso: string | Date) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, "");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mayday//Booking//EN", "BEGIN:VEVENT",
    `UID:${b.id}`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(s.start)}`, `DTEND:${z(s.end)}`,
    `SUMMARY:Appointment with ${s.provider}`, "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export function ConfirmationStep({ booking, slot, onCancel, onBookAnother, onCopied }: Props) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const first = booking.name.split(" ")[0];
  const start = slot ? new Date(slot.start) : null;

  const addToCalendar = () => {
    if (!slot) return;
    const url = URL.createObjectURL(new Blob([icsFor(booking, slot)], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "appointment.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(booking.id);
      onCopied();
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };

  const cancel = async () => {
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), 4000);
      return;
    }
    clearTimeout(timer.current);
    setBusy(true);
    await onCancel().finally(() => setBusy(false));
  };

  return (
    <section className="flex w-full flex-col gap-12" aria-labelledby="done-heading">
      <div className="flex flex-col gap-6">
        <span className="pop grid size-16 place-items-center text-[var(--ds-success-base)]" aria-hidden>
          <Icon icon={Check2} size={64} color="var(--ds-success-base)" />
        </span>
        <div className="flex flex-col gap-[6px]">
          <h1 id="done-heading" tabIndex={-1} className="text-[20px] font-medium leading-7 text-[var(--ds-text-strong)] outline-none">
            You’re booked, {first}
          </h1>
          <p className="text-[13px] leading-5 tracking-[-0.065px] text-[var(--ds-text-soft)]">
            Your appointment has been booked, you will be need note your confirmation ID
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-6">
        <p className="text-[14px] font-medium leading-5 tracking-[-0.07px] text-[var(--ds-text-soft)]">Details</p>
        <dl className="flex flex-col gap-5 text-[14px] leading-5 tracking-[-0.07px]">
          <Row label="When">
            {start ? (
              <span className="flex items-center gap-3">
                {longDay(start)}
                <span aria-hidden className="size-1 rounded-full bg-[var(--ds-text-soft)]" />
                {clock(start)}
              </span>
            ) : (
              "—"
            )}
          </Row>
          <Row label="Name">
            {booking.name}
          </Row>
          <Row label="Email">{booking.email}</Row>
          <Row label="Confirmation ID">
            <span className="flex items-center gap-3">
              <span className="break-all text-right">{booking.id}</span>
              <CompactButton icon={<Icon icon={Copy2} size={16} />} style="ghost" size="medium" aria-label="Copy confirmation ID" onClick={copy} />
            </span>
          </Row>
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="primary" style="filled" size="small" onClick={addToCalendar} disabled={!slot}>
          Add to calendar
        </Button>
        <Button type="neutral" style="lighter" size="small" onClick={onBookAnother}>
          Book another
        </Button>
        <Button type="error" style="lighter" size="small" onClick={cancel} loading={busy}>
          {armed ? "Tap again to cancel" : "Cancel booking"}
        </Button>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <dt className="font-medium text-[var(--ds-text-soft)]">{label}</dt>
      <dd className="m-0 font-medium text-[var(--ds-text-strong)]">{children}</dd>
    </div>
  );
}
