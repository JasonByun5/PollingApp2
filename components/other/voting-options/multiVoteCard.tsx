import {useState} from "react";
import OptionCard from "../optionCard";

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
    <div className="grid grid-cols-2 gap-y-4">
      {options.map((opt: PollOption) => (
        <div 
          key={opt.id}
          className="group flex relative flex-col items-center"
        >
          <label>
          <OptionCard option={opt} onDelete={() => {}} />
            <input 
              type="radio" 
              name="vote" 
              value={opt.id}
              checked={selected === opt.id}
              onChange={e => setSelected(e.target.value)}
            />
          </label>
        </div>
      ))}

      <button
        className="cursor-pointer"
        onClick={submitPoll}
      >Submit Vote</button>
    </div>

    
  )
}

export default MultiVoteCard;