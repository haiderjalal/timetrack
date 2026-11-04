// Fallbacks for the shell's streamed parts. Same size as the real thing, so
// nothing shifts when the session-dependent content arrives.

export function SidebarSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <span className="flex items-center gap-2.5 rounded-xl border p-2 max-lg:border-transparent max-lg:p-1">
        <span className="size-7 shrink-0 rounded-lg bg-muted motion-safe:animate-pulse" />
        <span className="flex flex-1 flex-col gap-1.5 max-lg:hidden">
          <span className="h-4 w-28 rounded bg-muted motion-safe:animate-pulse" />
          <span className="h-3 w-14 rounded bg-muted motion-safe:animate-pulse" />
        </span>
      </span>
      <span className="flex flex-col gap-2 px-2">
        <span className="h-3 w-8 rounded bg-muted motion-safe:animate-pulse max-lg:hidden" />
        <span className="h-8 rounded-lg bg-muted motion-safe:animate-pulse" />
      </span>
    </div>
  );
}

export function TopBarSkeleton() {
  return (
    <span aria-hidden="true" className="flex flex-1 items-center gap-3">
      <span className="h-5 w-32 rounded bg-muted motion-safe:animate-pulse" />
      <span className="flex-1" />
      <span className="size-8 rounded-full bg-muted motion-safe:animate-pulse" />
    </span>
  );
}
