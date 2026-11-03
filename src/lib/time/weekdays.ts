export interface Weekday {
  /** 0 = Sunday … 6 = Saturday, matching work_schedule_days.weekday. */
  value: number;
  name: string;
  shortName: string;
}

const WEEKDAYS_FROM_SUNDAY: readonly Weekday[] = [
  { value: 0, name: "Sunday", shortName: "Sun" },
  { value: 1, name: "Monday", shortName: "Mon" },
  { value: 2, name: "Tuesday", shortName: "Tue" },
  { value: 3, name: "Wednesday", shortName: "Wed" },
  { value: 4, name: "Thursday", shortName: "Thu" },
  { value: 5, name: "Friday", shortName: "Fri" },
  { value: 6, name: "Saturday", shortName: "Sat" },
];

/** The seven days in display order for an org's first day of the week. */
export function getWeekdays(weekStartsOn: number = 1): Weekday[] {
  const start = ((weekStartsOn % 7) + 7) % 7;
  return [
    ...WEEKDAYS_FROM_SUNDAY.slice(start),
    ...WEEKDAYS_FROM_SUNDAY.slice(0, start),
  ];
}

export function getWeekdayName(value: number): string {
  return WEEKDAYS_FROM_SUNDAY[value]?.name ?? "";
}
