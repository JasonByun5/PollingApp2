import { useState } from "react";
import OptionCard from "../option-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PollOption = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
};

type MultiVoteCardProps = {
  options: PollOption[];
  pollId: string;
  setVoted: (voted: boolean) => void;
};

function YesNoVoteCard ({options, pollId, setVoted}: MultiVoteCardProps) {
  const [votes, setVotes] = useState<Record<string, 'yes' | 'no' | 'maybe'>>({});

  const handleVoteSelection = (optionId: string, voteType: 'yes' | 'no' | 'maybe') => {
    setVotes(prev => ({
      ...prev,
      [optionId]: voteType
    }));
  };

  const submitAllVotes = async () => {
    if (Object.keys(votes).length === 0) {
      alert('Please vote on at least one option');
      return;
    }

    try{
      const res = await fetch(`/api/polls/${pollId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votes }),
      })

      if (res.status === 409) {
        alert('You have already voted on this poll');
        return;
      }

      if (!res.ok){
        throw new Error("failed to submit votes")
      }

      setVoted(true)

    } catch(err){
      console.error(err);
      alert('Error submitting votes');
    }
  }

  return(
    <div className="space-y-6">
      {options.map((opt) => (
        <div
          className="grid grid-cols-1 gap-6 border-b border-border pb-6 last:border-0 sm:grid-cols-2"
          key={opt.id}
        >
          <div className="flex items-center justify-center">
            <OptionCard option={opt} onDelete={undefined} />
          </div>

          <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:items-center">
            <button
              type="button"
              className={cn(
                "h-12 w-full rounded-[6px] border text-sm font-semibold transition-colors sm:w-32",
                votes[opt.id] === 'yes'
                  ? "border-emerald-600 bg-emerald-500 text-white"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
              )}
              onClick={() => handleVoteSelection(opt.id, 'yes')}
            >
              Yes
            </button>
            <button
              type="button"
              className={cn(
                "h-12 w-full rounded-[6px] border text-sm font-semibold transition-colors sm:w-32",
                votes[opt.id] === 'no'
                  ? "border-red-600 bg-red-500 text-white"
                  : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
              )}
              onClick={() => handleVoteSelection(opt.id, 'no')}
            >
              No
            </button>
            <button
              type="button"
              className={cn(
                "h-12 w-full rounded-[6px] border text-sm font-semibold transition-colors sm:w-32",
                votes[opt.id] === 'maybe'
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
              onClick={() => handleVoteSelection(opt.id, 'maybe')}
            >
              Maybe
            </button>
          </div>
        </div>
      ))}

      <div className="flex justify-stretch pt-2 sm:justify-center">
        <Button className="w-full sm:w-auto" onClick={submitAllVotes}>
          Submit all votes ({Object.keys(votes).length})
        </Button>
      </div>
    </div>
  )
}

export default YesNoVoteCard;
