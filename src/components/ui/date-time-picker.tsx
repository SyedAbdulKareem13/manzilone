"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const QUICK_TIMES: { label: string; value: string }[] = [
  { label: "Morning", value: "09:00" },
  { label: "Noon", value: "12:00" },
  { label: "Afternoon", value: "15:00" },
  { label: "End of day", value: "17:00" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function dateISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Human label for a "YYYY-MM-DDTHH:mm" value, e.g. "27 Jun 2026 · 9:00 AM". */
function formatDisplay(val: string): string {
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

/** 12-hour label for a "HH:mm" string, e.g. "09:00" -> "9:00 AM". */
function timeLabel(t: string): string {
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return t;
  const mer = h < 12 ? "AM" : "PM";
  const hr12 = h % 12 === 0 ? 12 : h % 12;
  return `${hr12}:${pad(m)} ${mer}`;
}

/**
 * Premium date + time picker — a Popover month calendar plus a styled time row,
 * emitting a "YYYY-MM-DDTHH:mm" local value (drop-in for datetime-local fields).
 */
export function DateTimePicker({
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = "Pick date & time",
  className,
}: {
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [internal, setInternal] = React.useState<string>(defaultValue ?? "");
  const val = controlledValue ?? internal;
  const [open, setOpen] = React.useState(false);

  const [datePart, timePartRaw] = val ? val.split("T") : ["", ""];
  const timePart = timePartRaw ?? "";

  const selected = datePart ? new Date(datePart + "T00:00:00") : null;
  const [view, setView] = React.useState<Date>(() => {
    const base = selected ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  // Re-center the calendar on the value's month if it changes after mount
  // (e.g. the edit dialog populates a due date in a different month).
  React.useEffect(() => {
    if (!datePart) return;
    const d = new Date(datePart + "T00:00:00");
    if (!Number.isNaN(d.getTime())) setView(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [datePart]);

  function emit(d: string, t: string) {
    const next = d ? `${d}T${t || "09:00"}` : "";
    if (controlledValue === undefined) setInternal(next);
    onChange?.(next);
  }

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO = dateISO(new Date());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background/60 px-3 py-2 text-sm shadow-sm transition-colors hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            !val && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{val ? formatDisplay(val) : placeholder}</span>
          <CalendarDays className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[18rem] p-3" align="start">
        {/* Month header */}
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setView(new Date(year, month - 1, 1))}
            className="grid h-7 w-7 place-items-center rounded-lg hover:bg-accent"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-medium">
            {MONTHS[month]} {year}
          </div>
          <button
            type="button"
            onClick={() => setView(new Date(year, month + 1, 1))}
            className="grid h-7 w-7 place-items-center rounded-lg hover:bg-accent"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />;
            const iso = dateISO(new Date(year, month, d));
            const isSelected = iso === datePart;
            const isToday = iso === todayISO;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => emit(iso, timePart)}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg text-sm transition-colors",
                  isSelected
                    ? "btn-gradient font-semibold text-white"
                    : isToday
                      ? "border border-primary/40 text-primary"
                      : "hover:bg-accent"
                )}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* Time row */}
        <div className="mt-3 border-t pt-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Time
            {timePart && <span className="ml-auto font-semibold text-foreground">{timeLabel(timePart)}</span>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TIMES.map((q) => {
              const active = q.value === timePart;
              return (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => emit(datePart || todayISO, q.value)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-background/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {q.label}
                </button>
              );
            })}
            <input
              type="time"
              value={timePart}
              onChange={(e) => {
                // Ignore an emptied field so clearing doesn't snap to the 09:00 default.
                if (e.target.value) emit(datePart || todayISO, e.target.value);
              }}
              aria-label="Custom time"
              className="ml-auto h-7 rounded-lg border border-input bg-background/60 px-2 text-xs shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between border-t pt-2">
          <button
            type="button"
            onClick={() => {
              emit("", "");
              setOpen(false);
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                emit(dateISO(now), `${pad(now.getHours())}:${pad(now.getMinutes())}`);
                setView(new Date(now.getFullYear(), now.getMonth(), 1));
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-primary hover:underline"
              disabled={!val}
            >
              Done
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DateTimePicker;
