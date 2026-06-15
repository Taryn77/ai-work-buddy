import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-sm shrink-0",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h10" />
        <path d="M4 12h7" />
        <path d="M4 17h10" />
        <circle cx="18" cy="17" r="3" />
        <path d="M18 12V8" />
        <path d="M16 10l2-2 2 2" />
      </svg>
    </div>
  );
}

export function BrandLockup() {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <BrandMark className="h-8 w-8" />
      <div className="min-w-0 leading-tight">
        <div className="text-sm font-semibold truncate">Worksmith AI</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">Productivity Suite</div>
      </div>
    </div>
  );
}
