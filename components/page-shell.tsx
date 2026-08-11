import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  /** max-w-3xl | max-w-4xl | max-w-5xl */
  size?: "md" | "lg" | "xl";
  /** When false, renders open layout without the bordered card surface */
  card?: boolean;
};

const sizeMap = {
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
} as const;

export function PageShell({
  children,
  className,
  size = "lg",
  card = true,
}: PageShellProps) {
  return (
    <div className="flex justify-center px-4 py-10 sm:px-6 sm:py-14">
      <div
        className={cn(
          "w-full",
          sizeMap[size],
          card &&
            "rounded-xl border border-border bg-card px-6 py-8 shadow-[0_2px_12px_rgba(26,31,54,0.06)] sm:px-10 sm:py-10",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
          {title}
        </h1>
        {description && (
          <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
