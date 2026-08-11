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

  // Preserve original submitPoll / selected for future wiring; ranking UX unchanged.
  void submitPoll;
  void setSelected;

  function removeFromRanking(id: string) {
    setRanking(prev => prev.filter(opt => opt.id !== id));
  }

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
      const existingIndex = newRanking.findIndex(opt => opt.id === droppedOption.id);
      if (existingIndex !== -1) {
        newRanking.splice(existingIndex, 1);
      }
      newRanking.splice(targetIndex, 0, droppedOption);
      return newRanking;
    });
  };

  return(
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-8 lg:flex-row">
        <div className="grid grid-cols-[auto,1fr] gap-x-6 px-2">
          <div className="flex flex-col space-y-6">
            {rows.map(num => (
              <div key={num} className="flex h-24 items-center text-4xl font-semibold text-primary/40">
                {num}
              </div>
            ))}
          </div>

          <div className="flex flex-col space-y-6">
            {rows.map((_, idx) => {
              const opt = ranking[idx];
              return opt ? (
                <div
                  key={opt.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, opt)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  className="relative flex h-24 w-24 cursor-move items-center justify-center rounded-lg border border-border bg-card p-2 shadow-[0_1px_4px_rgba(26,31,54,0.04)] transition-shadow hover:shadow-md"
                >
                  <button
                    type="button"
                    className="absolute right-1 top-1 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFromRanking(opt.id)}
                  >
                    ✕
                  </button>
                  {opt.imageUrl ? (
                    <img
                      src={opt.imageUrl}
                      alt={opt.title}
                      className="h-16 w-16 object-contain"
                    />
                  ) : (
                    <span className="px-1 text-center text-xs font-medium text-foreground">
                      {opt.title}
                    </span>
                  )}
                </div>
              ) : (
                <div
                  key={idx}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <span className="text-xs text-muted-foreground">Drop</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {options.filter(opt => !ranking.find(rankedOpt => rankedOpt.id === opt.id)).map((opt) => (
            <div
              key={opt.id}
              draggable
              onDragStart={(e) => handleDragStart(e, opt)}
              className="cursor-move transition-opacity hover:opacity-80"
            >
              <OptionCard option={opt} onDelete={undefined} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RankVoteCard;
