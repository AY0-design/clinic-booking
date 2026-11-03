"use client";

import { useMemo, useState } from "react";
import { Button, CompactDropdown, Icon } from "spiral-ui";
import Earth4 from "@mingcute/react/core-regular/earth-4";
import Left from "@mingcute/react/core-regular/left";
import Right from "@mingcute/react/core-regular/right";
import type { Slot } from "@/lib/api";
import { clock, dayKey, pad, shortDay, slotHeading } from "@/lib/dates";

const WINDOW = 7;
const DAY_MS = 86_400_000;

type Props = {
  slots: Slot[];
  loading: boolean;
  now: number; // when the slots were fetched; past slots are hidden relative to this
  error: string | null;
  selectedId: string | null;
  onSelect: (slot: Slot) => void;
  onContinue: () => void;
};

export function TimeStep({ slots, loading, now, error, selectedId, onSelect, onContinue }: Props) {
  const [provider, setProvider] = useState("");
  const [pageStart, setPageStart] = useState<number | null>(null); // user-paged index of first visible day
  const [pickedDay, setPickedDay] = useState<string | null>(null);

  const providers = useMemo(() => [...new Set(slots.map((s) => s.provider))], [slots]);
  const open = useMemo(
    () => slots.filter((s) => s.available && new Date(s.start).getTime() > now && (!provider || s.provider === provider)),
    [slots, provider, now],
  );

  // A continuous run of calendar days from the first to the last open slot.
  const days = useMemo(() => {
    if (!open.length) return [] as Date[];
    const times = open.map((s) => new Date(s.start).setHours(0, 0, 0, 0));
    const first = Math.min(...times);
    const last = Math.max(...times);
    const out: Date[] = [];
    for (let t = first; t <= last; t += DAY_MS) out.push(new Date(t));
    return out;
  }, [open]);

  const openByDay = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const s of open) {
      const k = dayKey(new Date(s.start));
      m.set(k, [...(m.get(k) ?? []), s].sort((a, b) => a.start.localeCompare(b.start)));
    }
    return m;
  }, [open]);

  // The day the user picked, or the first day that still has an open slot.
  const activeDay =
    pickedDay && openByDay.has(pickedDay)
      ? pickedDay
      : (days.find((d) => openByDay.has(dayKey(d))) ? dayKey(days.find((d) => openByDay.has(dayKey(d)))!) : null);
  const maxStart = Math.max(0, days.length - WINDOW);
  const activeIndex = days.findIndex((d) => dayKey(d) === activeDay);
  const dayStart = Math.min(maxStart, pageStart ?? Math.max(0, activeIndex));

  const visible = days.slice(dayStart, dayStart + WINDOW);
  const activeDate = days.find((d) => dayKey(d) === activeDay) ?? days[0];
  // One chip per start time. With several providers free at that time it shows how many spots are
  // left; with a single provider it shows who that is.
  const times = useMemo(() => {
    const groups = new Map<string, Slot[]>();
    for (const sl of (activeDay && openByDay.get(activeDay)) || []) groups.set(sl.start, [...(groups.get(sl.start) ?? []), sl]);
    return [...groups.values()].map((g) => g.sort((a, b) => a.provider.localeCompare(b.provider)));
  }, [openByDay, activeDay]);
  const selected = slots.find((s) => s.id === selectedId);
  const cols = loading ? WINDOW : Math.max(1, visible.length);
  const activeVisible = visible.findIndex((d) => dayKey(d) === activeDay);

  return (
    <section className="flex w-full flex-col gap-16" aria-labelledby="slot-heading">
      <div className="flex w-full flex-col gap-8">
        <div className="flex w-full flex-col gap-6">
          <div className="flex w-full items-end justify-between">
            <div className="flex w-[137px] flex-col gap-2">
              <p className="text-[14px] font-medium leading-5 tracking-[-0.07px] text-[var(--ds-text-soft)]">Select a slot</p>
              <h2 id="slot-heading" className="text-[20px] font-medium leading-7 text-[var(--ds-text-strong)] whitespace-nowrap">
                {activeDate ? slotHeading(activeDate) : "—"}
              </h2>
            </div>
            <CompactDropdown
              type="icon"
              size="sm"
              className="[&>button]:rounded-[8px]! [&>button]:border-transparent! [&>button]:bg-[var(--ds-bg-surface)]!"
              icon={
                <span className="flex items-center gap-2">
                  <Icon icon={Earth4} size={16} />
                  <span className="text-[13px] font-medium leading-5 tracking-[-0.065px] text-[var(--ds-text-sub)]">{provider || "Any provider"}</span>
                </span>
              }
              aria-label="Provider"
              options={[{ value: "", label: "Any provider" }, ...providers.map((p) => ({ value: p, label: p }))]}
              value={provider}
              onChange={(v) => {
                setProvider(v);
                setPickedDay(null);
                setPageStart(null);
              }}
            />
          </div>

          <div className="flex w-full items-center gap-5 rounded-[12px] bg-[var(--ds-bg-surface)] p-1">
            <button
              type="button"
              aria-label="Previous days"
              disabled={dayStart === 0}
              onClick={() => setPageStart(Math.max(0, dayStart - WINDOW))}
              className="grid h-[58px] w-10 shrink-0 place-items-center rounded-[8px] text-[var(--ds-text-sub)] transition-[transform,opacity] duration-150 active:scale-95 disabled:opacity-40"
            >
              <Icon icon={Left} size={20} />
            </button>
            <div className="relative grid flex-1 items-center gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} role="group" aria-label="Day">
              {/* One pill slides between days (transform only) instead of each day swapping its own background. */}
              {!loading && activeVisible >= 0 && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 rounded-[8px] bg-[var(--ds-bg-default)] shadow-[0_4px_6px_rgba(0,0,0,0.05)] transition-transform duration-[250ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                  style={{
                    width: `calc((100% - ${(cols - 1) * 8}px) / ${cols})`,
                    transform: `translateX(calc(${activeVisible} * (100% + 8px)))`,
                  }}
                />
              )}
              {loading
                ? Array.from({ length: WINDOW }).map((_, i) => <div key={i} className="h-[58px] animate-pulse rounded-[8px] bg-[var(--ds-bg-subtle,#e5e5e5)]/50" />)
                : visible.map((d) => {
                    const k = dayKey(d);
                    const has = openByDay.has(k);
                    const on = k === activeDay;
                    return (
                      <button
                        key={k}
                        type="button"
                        disabled={!has}
                        aria-pressed={on}
                        onClick={() => setPickedDay(k)}
                        className={`relative z-10 flex flex-col items-center justify-center gap-[6px] rounded-[8px] py-[6px] font-medium transition-[color,transform,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] disabled:opacity-40 ${
                          on ? "text-[var(--ds-text-strong)]" : "text-[var(--ds-text-soft)]"
                        }`}
                      >
                        <span className="text-[13px] leading-5 tracking-[-0.065px]">{shortDay(d)}</span>
                        <span className={`text-[14px] leading-5 tracking-[-0.07px] ${on ? "" : "text-[var(--ds-text-sub)]"}`}>{pad(d.getDate())}</span>
                      </button>
                    );
                  })}
            </div>
            <button
              type="button"
              aria-label="Next days"
              disabled={dayStart + WINDOW >= days.length}
              onClick={() => setPageStart(Math.min(maxStart, dayStart + WINDOW))}
              className="grid h-[58px] w-10 shrink-0 place-items-center rounded-[8px] text-[var(--ds-text-sub)] transition-[transform,opacity] duration-150 active:scale-95 disabled:opacity-40"
            >
              <Icon icon={Right} size={20} />
            </button>
          </div>
        </div>

        <div aria-live="polite">
          {error ? (
            <p className="text-[14px] text-[var(--ds-error-base)]">{error}</p>
          ) : !loading && !times.length ? (
            <p className="text-[14px] text-[var(--ds-text-soft)]">No open times right now. Please check back soon.</p>
          ) : (
            <div key={`${activeDay}|${provider}`} className="grid min-h-[136px] grid-cols-2 content-start gap-x-3 gap-y-5" role="group" aria-label="Time">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded-[10px] bg-[var(--ds-bg-surface)]" />)
                : times.map((group, i) => {
                    const s = group[0];
                    const on = group.some((g) => g.id === selectedId);
                    return (
                      <button
                        key={s.start}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onSelect(group.find((g) => g.id === selectedId) ?? s)}
                        style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                        className={`enter flex h-8 w-full items-center justify-center gap-[10px] rounded-[10px] border px-3 py-[6px] text-[13px] tracking-[-0.065px] transition-[border-color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] ${
                          on
                            ? "border-[var(--ds-primary-base)] bg-[var(--ds-primary-base)]/10"
                            : "border-[var(--ds-stroke-soft)] bg-[var(--ds-bg-default)] hover:border-[var(--ds-primary-base)]/40"
                        }`}
                      >
                        <span className="font-medium leading-5 text-[var(--ds-text-strong)] whitespace-nowrap">{clock(new Date(s.start))}</span>
                        <span aria-hidden className="size-1 rounded-full bg-[var(--ds-text-soft)]" />
                        <span className="leading-5 whitespace-nowrap text-[var(--ds-text-soft)]">{group.length > 1 ? `${group.length} spot available` : s.provider}</span>
                      </button>
                    );
                  })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="primary" style="filled" size="small" disabled={!selected} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </section>
  );
}
