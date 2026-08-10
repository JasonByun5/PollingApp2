import {useEffect, useState} from "react";
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

function RankVoteCard ({options, pollId, setVoted}: MultiVoteCardProps) {

  const [selected, setSelected] = useState('');
  const [rows, setRows] = useState<number[]>([]);
  const [ranking, setRanking] = useState<PollOption[]>([]);

  useEffect(() => {
    // Initialize rows based on number of options
    const numOptions = options.length;
    const newRows = [];
    for (let i = 1; i <= numOptions; i++) {
      newRows.push(i);
    }
    setRows(newRows);
  }, [options]);

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


  function addToRanking(obj: PollOption) {
    setRanking(prev => [...prev, obj]);
  }

  function removeFromRanking(id: string) {
    setRanking(prev => prev.filter(opt => opt.id !== id));
  }

  // Ngl GPT made these functions for drag and drop
  const handleDragStart = (e: React.DragEvent, option: PollOption) => {
    e.dataTransfer.setData('application/json', JSON.stringify(option));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const optionData = e.dataTransfer.getData('application/json');
    const droppedOption: PollOption = JSON.parse(optionData);
    
    setRanking(prev => {
      const newRanking = [...prev];
      // Remove from existing position if already ranked
      const existingIndex = newRanking.findIndex(opt => opt.id === droppedOption.id);
      if (existingIndex !== -1) {
        newRanking.splice(existingIndex, 1);
      }
      // Insert at target position
      newRanking.splice(targetIndex, 0, droppedOption);
      return newRanking;
    });
  };




  return(
    <div className="flex flex-row justify-evenly">
                
        <div className="grid grid-cols-[auto,1fr] gap-x-6 px-4">
            {/* Column 1: rank numbers */}
            <div className="grid grid-rows justify-start space-y-6">
            {rows.map(num => (
                <div key={num} className="text-5xl font-bold text-blue-300">
                {num}
                </div>
            ))}
            </div>

            {/* Column 2: ranking slots */}
            <div className="flex flex-col justify-start space-y-6">
            {rows.map((_, idx) => {
                const opt = ranking[idx];
                return opt ? (
                <div
                    key={opt.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, opt)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    className="relative border rounded-xl bg-white shadow p-2 flex items-center justify-center cursor-move hover:shadow-lg transition-shadow"
                >
                    <button
                    className="absolute top-1 right-1 text-red-400 hover:text-red-600"
                    onClick={() => removeFromRanking(opt.id)}
                    >
                    ✕
                    </button>
                    <img
                    src={opt.imageUrl}
                    alt={opt.title}
                    className="h-20 w-20 object-contain"
                    />
                </div>
                ) : (
                <div
                    key={idx}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                    <span className="text-gray-400 text-sm">Drop here</span>
                </div>
                );
            })}
            </div>
        </div>
            
            
            <div className="grid grid-cols-2 gap-y-4">
                {options.filter(opt => !ranking.find(rankedOpt => rankedOpt.id === opt.id)).map((opt) => (
                <div 
                    key={opt.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, opt)}
                    className="w-[200px] h-[200px] cursor-move hover:opacity-75 transition-opacity"
                >
                    <OptionCard option={opt} onDelete={() => {}} />
                </div>
            ))}
            </div>
        </div>

    
  )
}

export default RankVoteCard;