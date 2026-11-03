"use client";

import { useSyncExternalStore } from "react";
import { todayLabel } from "@/lib/dates";

const subscribeNever = () => () => {};

export function Header({ onOpenRecords, onGoBooking }: { onOpenRecords: () => void; onGoBooking: () => void }) {
  // Read the clock on the client only so the prerendered HTML never bakes in a stale date.
  const today = useSyncExternalStore(subscribeNever, todayLabel, () => "");

  return (
    <header className="flex w-full items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-logo text-[20px] leading-6 text-[var(--ds-primary-base)]">Mayday</span>
        <span aria-hidden className="h-5 w-0 rotate-12 border-l border-[var(--ds-stroke-mild)] mx-[4px]" />
        <nav className="flex gap-4 text-[13px] tracking-[-0.065px]">
          <button type="button" onClick={onGoBooking} className="font-medium text-[var(--ds-text-strong)]" aria-current="page">
            Booking
          </button>
          <button
            type="button"
            onClick={onOpenRecords}
            className="text-[var(--ds-text-soft)] transition-colors duration-150 hover:text-[var(--ds-text-strong)]"
          >
            My records
          </button>
        </nav>
      </div>
      <p className="text-[13px] font-medium tracking-[-0.065px] text-[var(--ds-text-soft)]">{today}</p>
    </header>
  );
}
