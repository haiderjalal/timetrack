interface SectionHeadingProps {
  /** The h2's id, for the section's aria-labelledby. */
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  align?: "start" | "center";
}

/** Brand eyebrow + h2 + intro used by every landing page section. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "start",
}: SectionHeadingProps) {
  const alignment =
    align === "center" ? "items-center text-center mx-auto" : "items-start";

  return (
    <div className={`flex max-w-2xl reveal flex-col gap-3 ${alignment}`}>
      <p className="text-xs font-semibold tracking-widest text-brand uppercase">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="text-3xl font-semibold tracking-tight text-balance"
      >
        {title}
      </h2>
      {description ? (
        <p className="text-base text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
