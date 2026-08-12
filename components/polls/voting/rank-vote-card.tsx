import { useEffect, useRef, useState } from "react";
import OptionCard from "../option-card";
import { Button } from "@/components/ui/button";

type PollOption = {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  imageUrl?: string;
};

type RankVoteCardProps = {
  options: PollOption[];
  pollId: string;
  setVoted: (voted: boolean) => void;
};

type RankSlot = PollOption | null;

function optionImage(opt: PollOption) {
  return opt.image_url || opt.imageUrl;
}

function emptySlots(count: number): RankSlot[] {
  return Array.from({ length: count }, () => null);
}

/** Builds an off-screen ghost that follows the cursor via setDragImage */
function createDragPreview(option: PollOption): HTMLDivElement {
  const preview = document.createElement("div");
  preview.style.cssText = [
    "position:fixed",
    "top:-1000px",
    "left:-1000px",
    "width:96px",
    "height:96px",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "border-radius:8px",
    "border:1px solid #e2e5eb",
    "background:#fff",
    "box-shadow:0 8px 24px rgba(26,31,54,0.18)",
    "overflow:hidden",
    "pointer-events:none",
    "z-index:9999",
  ].join(";");

  const image = optionImage(option);
  if (image) {
    const img = document.createElement("img");
    img.src = image;
    img.alt = option.title;
    img.draggable = false;
    img.style.cssText = "width:64px;height:64px;object-fit:contain;";
    preview.appendChild(img);
  } else {
    const label = document.createElement("span");
    label.textContent = option.title;
    label.style.cssText =
      "padding:6px;font-size:12px;font-weight:600;text-align:center;color:#1A1F36;line-height:1.2;";
    preview.appendChild(label);
  }

  return preview;
}

function RankVoteCard({ options, pollId, setVoted }: RankVoteCardProps) {
  const [rows, setRows] = useState<number[]>([]);
  /** Fixed-length slots so any rank position can be filled independently */
  const [ranking, setRanking] = useState<RankSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setRows(options.map((_, i) => i + 1));
    setRanking(emptySlots(options.length));
  }, [options]);

  useEffect(() => {
    return () => {
      dragPreviewRef.current?.remove();
      dragPreviewRef.current = null;
    };
  }, []);

  const filledRanking = ranking.filter((opt): opt is PollOption => opt !== null);
  const isComplete =
    ranking.length === options.length &&
    ranking.every((slot) => slot !== null);

  const submitPoll = async () => {
    if (isSubmitting) return;

    if (!isComplete) {
      setError("Rank every option before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ranking: filledRanking.map((opt) => opt.id),
        }),
      });

      if (res.status === 409) {
        setError("You have already voted on this poll.");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          typeof data?.error === "string" ? data.error : "Failed to vote"
        );
      }

      setVoted(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error submitting vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  function removeFromRanking(id: string) {
    setRanking((prev) =>
      prev.map((slot) => (slot?.id === id ? null : slot))
    );
    setError(null);
  }

  const clearDragPreview = () => {
    dragPreviewRef.current?.remove();
    dragPreviewRef.current = null;
    setDraggingId(null);
  };

  const handleDragStart = (e: React.DragEvent, option: PollOption) => {
    e.dataTransfer.setData("application/json", JSON.stringify(option));
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(option.id);

    dragPreviewRef.current?.remove();
    const preview = createDragPreview(option);
    document.body.appendChild(preview);
    dragPreviewRef.current = preview;
    // Offset so the cursor sits in the middle of the ghost card
    e.dataTransfer.setDragImage(preview, 48, 48);
  };

  const handleDragEnd = () => {
    clearDragPreview();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const optionData = e.dataTransfer.getData("application/json");
    if (!optionData) return;

    const droppedOption: PollOption = JSON.parse(optionData);

    setRanking((prev) => {
      const next = [...prev];
      const fromIndex = next.findIndex((slot) => slot?.id === droppedOption.id);
      const displaced = next[targetIndex];

      if (fromIndex === targetIndex) return prev;

      if (fromIndex !== -1) {
        // Moving between slots: swap so any destination works
        next[fromIndex] = displaced;
        next[targetIndex] = droppedOption;
      } else {
        // Coming from the unranked pool: place into the chosen slot
        // (whatever was there returns to the pool)
        next[targetIndex] = droppedOption;
      }

      return next;
    });
    setError(null);
    clearDragPreview();
  };

  const rankedIds = new Set(filledRanking.map((opt) => opt.id));
  const unranked = options.filter((opt) => !rankedIds.has(opt.id));

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Drag options into any numbered slot (1 = favorite). You don’t have to
        fill them in order — rank all of them, then submit.
      </p>

      <div className="flex flex-col justify-between gap-8 lg:flex-row">
        <div className="w-full overflow-x-auto pb-1">
          <div className="grid min-w-0 grid-cols-[auto,1fr] gap-x-3 px-1 sm:gap-x-6 sm:px-2">
            <div className="flex flex-col space-y-4 sm:space-y-6">
              {rows.map((num) => (
                <div
                  key={num}
                  className="flex h-20 items-center text-3xl font-semibold text-primary/40 sm:h-24 sm:text-4xl"
                >
                  {num}
                </div>
              ))}
            </div>

            <div className="flex flex-col space-y-4 sm:space-y-6">
              {rows.map((_, idx) => {
                const opt = ranking[idx];
                const image = opt ? optionImage(opt) : undefined;
                return opt ? (
                  <div
                    key={opt.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, opt)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    className={`relative flex h-20 w-20 cursor-move items-center justify-center rounded-lg border border-border bg-card p-2 shadow-[0_1px_4px_rgba(26,31,54,0.04)] transition-opacity hover:shadow-md sm:h-24 sm:w-24 ${
                      draggingId === opt.id ? "opacity-40" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="absolute right-1 top-1 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromRanking(opt.id)}
                      aria-label={`Remove ${opt.title} from ranking`}
                    >
                      ✕
                    </button>
                    {image ? (
                      <img
                        src={image}
                        alt={opt.title}
                        draggable={false}
                        className="h-12 w-12 object-contain sm:h-16 sm:w-16"
                      />
                    ) : (
                      <span className="px-1 text-center text-xs font-medium text-foreground">
                        {opt.title}
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    key={`slot-${idx}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary/50 hover:bg-primary/5 sm:h-24 sm:w-24"
                  >
                    <span className="text-xs text-muted-foreground">Drop</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:flex-1">
          {unranked.map((opt) => (
            <div
              key={opt.id}
              draggable
              onDragStart={(e) => handleDragStart(e, opt)}
              onDragEnd={handleDragEnd}
              className={`cursor-move transition-opacity hover:opacity-80 ${
                draggingId === opt.id ? "opacity-40" : ""
              }`}
            >
              <OptionCard option={opt} onDelete={undefined} />
            </div>
          ))}
          {unranked.length === 0 && (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              All options ranked. You can still drag to reorder or swap slots.
            </p>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
        {error && (
          <p role="alert" className="text-sm text-destructive sm:mr-auto">
            {error}
          </p>
        )}
        <Button
          className="w-full sm:w-auto"
          onClick={submitPoll}
          disabled={isSubmitting || !isComplete}
        >
          {isSubmitting ? "Submitting…" : "Submit ranking"}
        </Button>
      </div>
    </div>
  );
}

export default RankVoteCard;
