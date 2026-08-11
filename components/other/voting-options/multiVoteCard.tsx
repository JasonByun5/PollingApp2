import {useState} from "react";
import OptionCard from "../optionCard";
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

function MultiVoteCard ({options, pollId, setVoted}: MultiVoteCardProps) {
  const [selected, setSelected] = useState('');

  const submitPoll = async () => {
    if (!selected) {
      alert('Please select an option before voting');
      return;
    }

    try{
      const res = await fetch(`/api/polls/${pollId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: selected }),
      })

      if (res.status === 409) {
        alert('You have already voted on this poll');
        return;
      }

      if (!res.ok){
        throw new Error("failed to vote")
      }

      setVoted(true)

    } catch(err){
      console.error(err);
      alert('Error submitting vote');
    }
  }

  return(
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {options.map((opt: PollOption) => (
          <label
            key={opt.id}
            className={cn(
              "relative flex cursor-pointer flex-col items-center rounded-lg transition-shadow",
              selected === opt.id && "ring-2 ring-primary ring-offset-2"
            )}
          >
            <OptionCard option={opt} onDelete={undefined} />
            <input
              type="radio"
              name="vote"
              value={opt.id}
              checked={selected === opt.id}
              onChange={e => setSelected(e.target.value)}
              className="mt-3 accent-primary"
            />
          </label>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={submitPoll}>
          Submit vote
        </Button>
      </div>
    </div>
  )
}

export default MultiVoteCard;
