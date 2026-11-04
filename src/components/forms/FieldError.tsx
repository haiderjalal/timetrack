interface FieldErrorProps {
  /** Referenced by the field's aria-describedby. */
  id: string;
  message: string | undefined;
}

/** A field's validation message, announced when it appears. */
export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

/** aria-describedby for a field: its hint, plus its error when there is one. */
export function describedBy(
  ...ids: (string | false | null | undefined)[]
): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}
