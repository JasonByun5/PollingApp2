import type { PollType } from "@/lib/poll-types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PollHeaderProps = {
  title: string;
  type: PollType;
  description?: string | null;
  /** Optional meta row (e.g. poll ID, total votes on results) */
  meta?: React.ReactNode;
  className?: string;
};

export function PollHeader({
  title,
  type,
  description,
  meta,
  className,
}: PollHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 space-y-3 border-b border-border pb-6",
        meta && "space-y-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
          {title}
        </h1>
        <Badge variant="secondary" className="font-normal">
          {type}
        </Badge>
      </div>
      {meta}
      {description ? (
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
