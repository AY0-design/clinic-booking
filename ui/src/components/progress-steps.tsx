// Spiral UI's StepIndicator only highlights the current step; the Figma design fills every
// step reached so far (both bars are blue on "Details"), so this one element is local.
const STEPS = ["Time", "Details"];

export function ProgressSteps({ current }: { current: 1 | 2 }) {
  return (
    <ol className="flex w-full items-center gap-2" aria-label="Booking progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const reached = n <= current;
        const active = n === current;
        return (
          <li key={label} className="flex min-w-0 flex-1 flex-col gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={`h-[6px] w-full rounded-full transition-colors duration-200 ${
                reached ? "bg-[var(--ds-primary-base)]" : "bg-[var(--ds-bg-subtle,#d9d9d9)]"
              }`}
            />
            <span
              className={`flex gap-1 text-[12px] leading-4 ${
                reached ? "text-[var(--ds-text-strong)]" : "text-[var(--ds-text-soft)]"
              } ${current === 1 ? (active ? "font-medium" : "") : active ? "font-medium" : ""}`}
            >
              <span>{n}.</span>
              <span>{label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
