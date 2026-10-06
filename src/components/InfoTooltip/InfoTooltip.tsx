"use client";

import { Info } from "lucide-react";
import { type ReactNode, useId, useState } from "react";

export interface InfoTooltipProps {
  label: string;
  children: ReactNode;
}

/** An info icon that explains something on hover or keyboard focus; Escape hides it (volare-brand components/data.md). */
export function InfoTooltip({ label, children }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
        className="inline-flex size-5 items-center justify-center rounded-full text-fg-secondary hover:text-fg"
      >
        <Info className="size-4" aria-hidden="true" />
      </button>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute right-0 top-full z-20 mt-2 w-60 whitespace-normal rounded-md bg-[#1a1625] px-3 py-2 text-left text-xs font-normal leading-relaxed text-[#f8f7fa] shadow-[var(--shadow-overlay)] dark:bg-[#f1f0f4] dark:text-[#1a1625]"
        >
          {children}
        </span>
      )}
    </span>
  );
}
