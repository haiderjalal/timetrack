const AFTERNOON_STARTS_AT = 12;
const EVENING_STARTS_AT = 17;

/** "Good morning" / "Good afternoon" / "Good evening" for an hour (0–23). */
export function getGreeting(hour: number): string {
  if (hour < AFTERNOON_STARTS_AT) return "Good morning";
  if (hour < EVENING_STARTS_AT) return "Good afternoon";
  return "Good evening";
}
