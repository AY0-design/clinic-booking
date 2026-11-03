"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, cancelBooking, createBooking, getSlots, type Booking, type Slot } from "@/lib/api";
import { Header } from "@/components/header";
import { TimeStep } from "@/components/time-step";
import { DetailsStep, type DetailsValue } from "@/components/details-step";
import { ConfirmationStep } from "@/components/confirmation-step";
import { ProgressSteps } from "@/components/progress-steps";
import { RecordsDrawer } from "@/components/records-drawer";

type Step = "time" | "details" | "done";

export default function Home() {
  const [step, setStep] = useState<Step>("time");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<DetailsValue>({ first: "", last: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // One idempotency key per distinct attempt, so a double click or a retry after a dropped
  // connection can never create two bookings.
  const attempt = useRef<{ sig: string; key: string } | null>(null);

  const [now, setNow] = useState(0);

  const refresh = useCallback(
    () =>
      getSlots()
        .then((all) => {
          setSlots(all);
          setNow(Date.now());
          setLoadError(null);
        })
        .catch((e) => setLoadError(e instanceof ApiError ? e.message : "Could not load times. Check your connection."))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const submit = async () => {
    const chosen = slots.find((s) => s.id === selectedId);
    if (!chosen) return;
    const payload = { slot_id: chosen.id, name: `${details.first.trim()} ${details.last.trim()}`, email: details.email.trim() };
    const sig = JSON.stringify(payload);
    if (!attempt.current || attempt.current.sig !== sig) attempt.current = { sig, key: crypto.randomUUID() };
    setSubmitting(true);
    setSubmitError(null);
    try {
      const b = await createBooking(payload, attempt.current.key);
      setBooking(b);
      attempt.current = null;
      setStep("done");
      refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setSubmitError("Sorry, someone just booked that time. Please pick another.");
        setSelectedId(null);
        setStep("time");
        refresh();
      } else if (e instanceof ApiError && e.status === 429) {
        setSubmitError(`Too many attempts for this email. Try again in ${e.retryAfter ?? 60} seconds.`);
      } else if (e instanceof ApiError) {
        setSubmitError(e.message);
      } else {
        setSubmitError("Network problem. Press Book appointment again; it is safe to retry.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    setBooking(null);
    setSelectedId(null);
    setDetails((d) => ({ ...d, first: "", last: "" }));
    setStep("time");
  };

  const cancelCurrent = async () => {
    if (!booking) return;
    try {
      await cancelBooking(booking.id);
      flash("Booking cancelled");
      await refresh();
      startOver();
    } catch (e) {
      flash(e instanceof ApiError ? e.message : "Could not cancel");
    }
  };

  const slot = slots.find((s) => s.id === (booking?.slot_id ?? selectedId));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col gap-12 px-5 py-8">
      <Header onOpenRecords={() => setRecordsOpen(true)} onGoBooking={() => step === "done" && startOver()} />

      {step !== "done" ? (
        <div className="flex w-full flex-col gap-12">
          <div className="flex w-full flex-col gap-10">
            <div className="flex flex-col gap-[6px]">
              <h1 className="text-[20px] font-medium leading-7 text-[var(--ds-text-strong)]">Book an appointment</h1>
              <p className="text-[13px] leading-5 tracking-[-0.065px] text-[var(--ds-text-soft)]">
                Pick a time, tell us who you are, and you&apos;re booked in.
              </p>
            </div>
            <ProgressSteps current={step === "time" ? 1 : 2} />
          </div>

          <div className="enter" key={step}>
            {step === "time" ? (
              <>
                {submitError && <p role="alert" className="mb-6 text-[14px] text-[var(--ds-error-base)]">{submitError}</p>}
                <TimeStep
                  slots={slots}
                  loading={loading}
                  now={now}
                  error={loadError}
                  selectedId={selectedId}
                  onSelect={(s) => {
                    setSelectedId(s.id);
                    setSubmitError(null);
                  }}
                  onContinue={() => setStep("details")}
                />
              </>
            ) : (
              <DetailsStep
                value={details}
                onChange={setDetails}
                submitting={submitting}
                error={submitError}
                onBack={() => {
                  setSubmitError(null);
                  setStep("time");
                }}
                onSubmit={submit}
              />
            )}
          </div>
        </div>
      ) : (
        booking && (
          <div className="enter">
            <ConfirmationStep booking={booking} slot={slot} onCancel={cancelCurrent} onBookAnother={startOver} onCopied={() => flash("ID copied")} />
          </div>
        )
      )}

      <RecordsDrawer
        open={recordsOpen}
        onClose={() => setRecordsOpen(false)}
        slots={slots}
        initialEmail={booking?.email ?? details.email}
        onChanged={refresh}
        onCopied={() => flash("ID copied")}
      />

      <div
        role="status"
        className={`pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 rounded-[10px] bg-[var(--ds-bg-inverse)] px-4 py-2 text-[13px] text-[var(--ds-text-inverse)] transition-[opacity,transform] duration-200 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {toast}
      </div>
    </main>
  );
}
