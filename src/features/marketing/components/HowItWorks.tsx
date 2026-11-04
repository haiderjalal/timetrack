import { SectionHeading } from "./SectionHeading";

const STEPS = [
  {
    title: "Sign in with Google",
    description: "No passwords to create or forget.",
  },
  {
    title: "Create your organization",
    description:
      "Set your timezone and working hours, for example Mon–Fri, 09:00–18:00, 8h a day.",
  },
  {
    title: "Invite your team",
    description: "Send email invites. Your team clocks in from day one.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="scroll-mt-20 border-t bg-background"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          id="how-title"
          eyebrow="How it works"
          title="Up and running in three steps"
        />
        <div className="relative">
          {/* Connector behind the step numbers; draws in as you scroll. */}
          <div
            aria-hidden="true"
            className="absolute top-5 right-[16%] left-[16%] hidden h-px reveal-line bg-brand/30 md:block"
          />
          <ol className="relative grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="flex reveal flex-col items-start gap-3 md:items-center md:text-center"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground tabular ring-8 ring-background"
                >
                  {index + 1}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="max-w-xs text-sm text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
