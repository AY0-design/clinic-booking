"use client";

import { useState } from "react";
import { Button, HintText, Icon, Input } from "spiral-ui";
import Information from "@mingcute/react/core-filled/information";

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export type DetailsValue = { first: string; last: string; email: string };

type Props = {
  value: DetailsValue;
  onChange: (v: DetailsValue) => void;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
};

export function DetailsStep({ value, onChange, submitting, error, onBack, onSubmit }: Props) {
  const [touched, setTouched] = useState(false);
  const firstBad = touched && !value.first.trim();
  const lastBad = touched && !value.last.trim();
  const emailBad = touched && !EMAIL_RE.test(value.email.trim());

  return (
    <form
      className="flex w-full flex-col gap-16"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (value.first.trim() && value.last.trim() && EMAIL_RE.test(value.email.trim())) onSubmit();
      }}
    >
      <div className="flex w-full flex-col gap-6">
        <p className="text-[14px] font-medium leading-5 tracking-[-0.07px] text-[var(--ds-text-soft)]">Your details</p>
        <div className="grid grid-cols-2 gap-6">
          <Input
            label="First name"
            size="sm"
            autoComplete="given-name"
            placeholder="Ayoposi"
            value={value.first}
            error={firstBad}
            hint={firstBad ? "Enter your first name" : undefined}
            onChange={(e) => onChange({ ...value, first: e.target.value })}
          />
          <Input
            label="Last name"
            size="sm"
            autoComplete="family-name"
            placeholder="Otubanjo"
            value={value.last}
            error={lastBad}
            hint={lastBad ? "Enter your last name" : undefined}
            onChange={(e) => onChange({ ...value, last: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Input
            label="Email"
            size="sm"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={value.email}
            error={emailBad}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
          />
          <HintText state={emailBad ? "error" : "default"} icon={<Icon icon={Information} size={16} />}>
            {emailBad ? "Enter a valid email, like you@example.com" : "It’s your email you will use to access your records"}
          </HintText>
        </div>
        {error && (
          <p role="alert" className="text-[14px] tracking-[-0.07px] text-[var(--ds-error-base)]">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="neutral" style="lighter" size="small" htmlType="button" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button type="primary" style="filled" size="small" htmlType="submit" loading={submitting}>
          Book appointment
        </Button>
      </div>
    </form>
  );
}
