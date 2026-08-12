import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

export function PollPageSkeleton({ size = "lg" }: { size?: "lg" | "xl" }) {
  return (
    <PageShell size={size}>
      <div className="mb-8 space-y-4 border-b border-border pb-6" aria-hidden="true">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-8 w-56 sm:w-72" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-3/4 max-w-lg" />
      </div>

      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-background px-4 py-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading poll…</span>
    </PageShell>
  );
}

export function DashboardSkeleton() {
  return (
    <PageShell size="xl">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2" aria-hidden="true">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28" aria-hidden="true" />
      </div>

      <div
        className="overflow-hidden rounded-lg border border-border"
        aria-hidden="true"
      >
        <div className="hidden border-b border-border bg-secondary/60 px-4 py-3 sm:block">
          <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_auto] gap-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="ml-auto h-3 w-12" />
          </div>
        </div>
        <ul className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_auto] sm:items-center sm:gap-4"
            >
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-14" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16 sm:ml-auto" />
            </li>
          ))}
        </ul>
      </div>
      <span className="sr-only">Loading your polls…</span>
    </PageShell>
  );
}

/** Compact full-page pulse used while AuthGate resolves */
export function AuthLoadingSkeleton() {
  return (
    <PageShell size="md">
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="mx-auto h-7 w-48" />
        <Skeleton className="mx-auto h-4 w-64 max-w-full" />
        <Skeleton className="mx-auto h-9 w-28" />
      </div>
      <span className="sr-only">Checking authentication…</span>
    </PageShell>
  );
}
