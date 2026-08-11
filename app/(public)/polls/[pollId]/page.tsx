'use client';

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MultiVoteCard from "../../../../components/other/voting-options/multiVoteCard";
import YesNoVoteCard from "../../../../components/other/voting-options/yesNoVoteCard";
import RankVoteCard from "../../../../components/other/voting-options/rankVoteCard";
import type { PollType } from "@/lib/poll-types";

// Force dynamic rendering to avoid prerendering issues with dynamic routes
export const dynamic = 'force-dynamic';

interface PollOption {
  id: string;
  poll_id: number;
  title: string;
  description?: string;
  vote_count: number;
  image_url?: string;
  created_at: string;
}

interface Poll {
  id: string;
  poll_id: number;
  author: string;
  title: string;
  description?: string;
  type: PollType;
  poll_options: PollOption[];
  created_at: string;
}

export default function PollVote() {
  const params = useParams();
  const pollId = params.pollId as string;
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);

  const [voted, setVoted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const fetchPoll = async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}`);

        if (!res.ok) throw new Error("Failed to fetch poll");

        const data = await res.json();
        setPoll(data);
        setLoading(false);

      } catch (err) {
        console.error('Error fetching poll:', err instanceof Error ? err.message : err);
        setLoading(false);
      }
    }

    fetchPoll();

  }, [pollId]);

  

  if (loading || !poll) return <div>Loading...</div>;

  
  return (
    <div>
      {voted && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-80 text-center space-y-4">
              <h2 className="text-xl font-semibold text-red-300">You Voted!</h2>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setVoted(false);
                    router.push('/')
                  }}
                  className="bg-red-200 hover:bg-red-300 text-white px-3 py-1 rounded"
                >Take me back!</button>
            </div> 
          </div>
        </div>
      )}


      <div className="flex justify-center p-10">
        <div className="w-3/5 bg-red-50 px-20 py-10 rounded-2xl flex flex-col shadow-md">
          <div className="w-full bg-white p-6 rounded-t-lg flex justify-evenly gap-1"> 
            <p className='text-[22px] font-bold'>{poll.title}</p>
            <p className='text-[18px] font-bold rounded px-2 py-1 w-24 bg-red-200 flex justify-center'>{poll.type}</p>
          </div>
          <div className="w-full bg-gray-200 py-9 px-6 rounded-b-lg mb-5 flex justify-evenly gap-1">
            {poll.description && <p className='text-[15px] font-bold'>{poll.description}</p>}
          </div>

          {poll.type === "multi" && (
            <MultiVoteCard options={poll.poll_options} pollId={pollId} setVoted={setVoted}/>
          )}

                    
          {poll.type === "yes/no" && (
            <YesNoVoteCard options={poll.poll_options} pollId={pollId} setVoted={setVoted}/>
          )}


          {poll.type === "rank" && (
              <RankVoteCard options={poll.poll_options} pollId={pollId} setVoted={setVoted} />
          )}


        </div>
      </div>
    </div>
  )

}