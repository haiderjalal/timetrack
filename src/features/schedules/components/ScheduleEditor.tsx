"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { FieldError, describedBy } from "@/components/forms/FieldError";
import { Input } from "@/components/ui/input";
import { getWeekdayName } from "@/lib/time/weekdays";
import {
  MAX_GRACE_MINUTES,
  MAX_REQUIRED_HOURS,
} from "@/lib/validations/schedule.schema";

import type { ScheduleInput } from "@/lib/validations/schedule.schema";

interface ScheduleFormValues {
  schedule: ScheduleInput;
}

/**
 * Working hours for each weekday plus the grace period (docs/design-system.md
 * §3, ScheduleEditor). Used inside a react-hook-form form with a `schedule` field.
 */
export function ScheduleEditor() {
  const { control, register, formState } = useFormContext<ScheduleFormValues>();
  const days = useWatch({ control, name: "schedule.days" });
  const errors = formState.errors.schedule;
  const graceError = errors?.graceMinutes?.message;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div
          aria-hidden="true"
          className="hidden grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_7rem] gap-3 border-b pb-2 text-xs font-medium text-muted-foreground md:grid"
        >
          <span>Day</span>
          <span>Start</span>
          <span>End</span>
          <span>Hours required</span>
        </div>

        {days.map((day, index) => {
          const dayName = getWeekdayName(day.weekday);
          const dayErrors = errors?.days?.[index];
          const fieldId = (field: string) => `schedule-${day.weekday}-${field}`;

          return (
            <fieldset
              key={day.weekday}
              // Phones: Start and End side by side, hours below, so a 12-hour
              // "06:00 PM" still fits. Wider screens: one row per day.
              className="grid grid-cols-2 gap-3 border-b py-3 sm:grid-cols-3 md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_7rem] md:items-start"
            >
              <legend className="sr-only">{dayName}</legend>

              <label className="col-span-2 flex min-h-10 items-center gap-3 text-sm font-medium sm:col-span-3 md:col-span-1">
                <input
                  type="checkbox"
                  className="size-4 shrink-0 accent-brand"
                  // Starts with the visible day name (WCAG 2.5.3, label in name).
                  aria-label={`${dayName} is a working day`}
                  {...register(`schedule.days.${index}.isWorkingDay`)}
                />
                {dayName}
              </label>

              {day.isWorkingDay ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={fieldId("start")}
                      className="text-xs font-medium text-muted-foreground md:sr-only"
                    >
                      Start
                    </label>
                    <Input
                      id={fieldId("start")}
                      type="time"
                      className="h-10 tabular"
                      aria-invalid={Boolean(dayErrors?.startTime)}
                      aria-describedby={describedBy(
                        dayErrors?.startTime && fieldId("start-error"),
                      )}
                      {...register(`schedule.days.${index}.startTime`)}
                    />
                    <FieldError
                      id={fieldId("start-error")}
                      message={dayErrors?.startTime?.message}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={fieldId("end")}
                      className="text-xs font-medium text-muted-foreground md:sr-only"
                    >
                      End
                    </label>
                    <Input
                      id={fieldId("end")}
                      type="time"
                      className="h-10 tabular"
                      aria-invalid={Boolean(dayErrors?.endTime)}
                      aria-describedby={describedBy(
                        dayErrors?.endTime && fieldId("end-error"),
                      )}
                      {...register(`schedule.days.${index}.endTime`)}
                    />
                    <FieldError
                      id={fieldId("end-error")}
                      message={dayErrors?.endTime?.message}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={fieldId("hours")}
                      className="text-xs font-medium text-muted-foreground md:sr-only"
                    >
                      Hours required
                    </label>
                    <Input
                      id={fieldId("hours")}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={MAX_REQUIRED_HOURS}
                      step={0.25}
                      className="h-10 tabular"
                      aria-invalid={Boolean(dayErrors?.requiredHours)}
                      aria-describedby={describedBy(
                        dayErrors?.requiredHours && fieldId("hours-error"),
                      )}
                      {...register(`schedule.days.${index}.requiredHours`)}
                    />
                    <FieldError
                      id={fieldId("hours-error")}
                      message={dayErrors?.requiredHours?.message}
                    />
                  </div>
                </>
              ) : (
                <p className="col-span-3 flex min-h-10 items-center text-sm text-muted-foreground max-md:hidden">
                  Day off
                </p>
              )}
            </fieldset>
          );
        })}
      </div>

      <div className="flex max-w-xs flex-col gap-1.5">
        <label htmlFor="schedule-grace" className="text-sm font-medium">
          Grace period
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="schedule-grace"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_GRACE_MINUTES}
            step={1}
            className="h-10 w-24 tabular"
            aria-invalid={Boolean(graceError)}
            aria-describedby={describedBy(
              "schedule-grace-hint",
              graceError && "schedule-grace-error",
            )}
            {...register("schedule.graceMinutes")}
          />
          <span className="text-sm text-muted-foreground">minutes</span>
        </div>
        <p id="schedule-grace-hint" className="text-sm text-muted-foreground">
          Clocking in up to this long after the start time still counts as on
          time.
        </p>
        <FieldError id="schedule-grace-error" message={graceError} />
      </div>
    </div>
  );
}
