const UTC = "UTC";

/** Every IANA zone the runtime knows, sorted, with UTC always included. */
export function listTimezones(): string[] {
  const zones = new Set(Intl.supportedValuesOf("timeZone"));
  zones.add(UTC);
  return [...zones].sort((a, b) => a.localeCompare(b));
}
