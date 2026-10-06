"use client";

import "react-day-picker/style.css";

import { CalendarDays, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";

import { formatIsoDate } from "@/lib/format";

export interface DatePickerProps {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
}

const toDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
};

const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** A button showing the chosen date that opens a calendar panel (react-day-picker, as in fishon). */
export function DatePicker({ label, value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const selected = toDate(value);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <span className="text-sm font-semibold text-fg">{label}</span>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface-sunken px-3 text-fg hover:border-brand"
      >
        <CalendarDays className="size-4 text-fg-secondary" aria-hidden="true" />
        <span className="tabular-nums">{formatIsoDate(value)}</span>
        <ChevronDown className={`size-4 text-fg-secondary transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="ffl-date-picker absolute right-0 top-full z-[1100] mt-2 rounded-xl border border-line bg-surface-overlay p-3 text-fg shadow-[var(--shadow-overlay)]"
        >
          <DayPicker
            mode="single"
            required
            captionLayout="dropdown"
            selected={selected}
            defaultMonth={selected}
            onSelect={(day) => {
              onChange(toIso(day));
              setOpen(false);
              buttonRef.current?.focus();
            }}
          />
        </div>
      )}
    </div>
  );
}
