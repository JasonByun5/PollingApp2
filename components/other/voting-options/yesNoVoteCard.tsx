
import { useState } from "react";
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
<div className="space-y-5">
  {options.map((opt) => (
    <div className="grid grid-cols-2 gap border-b" key={opt.id}>
      {/* Left column: Option Card */}
      <div className="flex justify-center items-center">
        <OptionCard option={opt} onDelete={() => {}}/>
      </div>

      {/* Right column: Voting buttons */}
      <div className="flex flex-col justify-center items-center gap-4 mb-5">
        <button 
          className={`text-lg font-bold w-[120px] h-[60px] rounded-2xl border-3 ${
            votes[opt.id] === 'yes' 
              ? 'bg-green-500 border-green-700 text-white' 
              : 'bg-green-300 border-green-500 hover:bg-green-400'
          }`}
          onClick={() => handleVoteSelection(opt.id, 'yes')}
        >
          YES
        </button>
        <button 
          className={`text-lg font-bold w-[120px] h-[60px] rounded-2xl border-3 ${
            votes[opt.id] === 'no' 
              ? 'bg-red-500 border-red-700 text-white' 
              : 'bg-red-300 border-red-500 hover:bg-red-400'
          }`}
          onClick={() => handleVoteSelection(opt.id, 'no')}
        >
          NO
        </button>
        <button 
          className={`text-lg font-bold w-[120px] h-[60px] rounded-2xl border-3 ${
            votes[opt.id] === 'maybe' 
              ? 'bg-blue-500 border-blue-700 text-white' 
              : 'bg-blue-300 border-blue-500 hover:bg-blue-400'
          }`}
          onClick={() => handleVoteSelection(opt.id, 'maybe')}
        >
          MAYBE
        </button>
      </div>
    </div>
  ))}

  <div className="flex justify-center mt-6">
    <button
      className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg"
      onClick={submitAllVotes}
    >
      Submit All Votes ({Object.keys(votes).length})
    </button>
  </div>
</div>
)

}

export default YesNoVoteCard;