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
      className="mx-auto flex w-full max-w-6xl scroll-mt-8 flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8"
    >
      <h2 id="how-title" className="text-2xl font-semibold tracking-tight">
        Up and running in three steps
      </h2>
      <ol className="grid gap-6 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-4 rounded-xl border bg-card p-5"
          >
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground tabular"
            >
              {index + 1}
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
