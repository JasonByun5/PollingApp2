'use client';

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MultiVoteCard from "../../../../components/other/voting-options/multiVoteCard";
import YesNoVoteCard from "../../../../components/other/voting-options/yesNoVoteCard";
import RankVoteCard from "../../../../components/other/voting-options/rankVoteCard";
import type { PollType } from "@/lib/poll-types";
import { PageShell } from "@/components/page-shell";
import { PollHeader } from "@/components/poll-header";
import { PageEmptyState } from "@/components/empty-state";
import { PollPageSkeleton } from "@/components/loading-skeletons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

  if (loading) {
    return <PollPageSkeleton size="lg" />;
  }

  if (!poll) {
    return (
      <PageEmptyState
        title="Poll not found"
        description="That code doesn’t match an existing poll. Double-check the number, or head home to try again."
        action={
          <Button asChild>
            <Link href="/">Back home</Link>
          </Button>
        }
      />
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
        <PollHeader
          title={poll.title}
          type={poll.type}
          description={poll.description}
        />

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
