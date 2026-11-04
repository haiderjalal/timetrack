/**
 * "Haider Jalal" → "Haider", for greetings. Null when the name is really the
 * email address (Google sent no name), so the greeting can leave it out.
 */
export function getFirstName(name: string): string | null {
  if (name.includes("@")) return null;
  return name.trim().split(/\s+/)[0] || null;
}
