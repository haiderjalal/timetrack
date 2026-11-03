import { Logo } from "@/components/shared/Logo";

export function MarketingFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Logo className="text-foreground" />
        <p>Attendance and time tracking for teams.</p>
      </div>
    </footer>
  );
}
