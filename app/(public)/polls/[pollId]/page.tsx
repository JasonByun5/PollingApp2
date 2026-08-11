'use client';

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MultiVoteCard from "../../../../components/other/voting-options/multiVoteCard";
import YesNoVoteCard from "../../../../components/other/voting-options/yesNoVoteCard";
import RankVoteCard from "../../../../components/other/voting-options/rankVoteCard";
import type { PollType } from "@/lib/poll-types";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  if (loading || !poll) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div>
      {voted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
          <div className="w-80 space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-[0_8px_30px_rgba(26,31,54,0.12)]">
            <h2 className="text-xl font-semibold text-foreground">You voted!</h2>
            <p className="text-sm text-muted-foreground">Thanks for participating.</p>
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setVoted(false);
                  router.push('/')
                }}
              >
                Take me back
              </Button>
            </div>
          </div>
        </div>
      )}

      <PageShell size="lg">
        <div className="mb-8 space-y-3 border-b border-border pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
              {poll.title}
            </h1>
            <Badge variant="secondary" className="font-normal">
              {poll.type}
            </Badge>
          </div>
          {poll.description && (
            <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {poll.description}
            </p>
          )}
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
      </PageShell>
    </div>
  )
}
