import { cn } from "@/lib/utils";
import { PageShell } from "@/components/layout/page-shell";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** dashed border panel vs open centered block */
  variant?: "plain" | "dashed";
};

export function EmptyState({
  title,
  description,
  action,
  className,
  variant = "plain",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        variant === "dashed"
          ? "rounded-lg border border-dashed border-border px-6 py-12"
          : "px-2 py-6",
        className,
      )}
    >
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

type PageEmptyStateProps = EmptyStateProps & {
  size?: "md" | "lg" | "xl";
};

/** Full-page empty / 404 surface inside PageShell */
export function PageEmptyState({
  size = "md",
  ...props
}: PageEmptyStateProps) {
  return (
    <PageShell size={size}>
      <EmptyState {...props} />
    </PageShell>
  );
}
