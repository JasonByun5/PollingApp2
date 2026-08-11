'use client';

import {useState, useEffect} from "react";
import { useRouter } from 'next/navigation';
import { useParams } from "next/navigation";
import { createClient } from '@/lib/supabase/client';
import { isAdminUser } from '@/lib/utils';
import type { PollType } from '@/lib/poll-types';
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

interface PollOption {
  id: string;
  poll_id: number;
  title: string;
  description: string;
  vote_count: number;
  yes_votes?: number;
  no_votes?: number;
  maybe_votes?: number;
  image_url: string;
  created_at: string;
}

interface Poll {
  id: string;
  poll_id: number;
  author: string;
  title: string;
  description: string;
  type: PollType;
  poll_options: PollOption[];
  created_at: string;
}

function PollResult () {
  const router = useRouter();
  const params = useParams();
  const pollId = params.pollId as string;

  const [totalVotes, setTotalVote] = useState(0);
  const [deleted, setDeleted] = useState(false);

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!poll) return;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCanDelete(!!user && (user.id === poll.author || isAdminUser(user)));
    };
    checkPermissions();
  }, [poll]);

  useEffect(() => {
    setLoading(true);
    const fetchPoll = async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}`);

        if (!res.ok) throw new Error("Failed to fetch poll");

        const data = await res.json();
        setPoll(data);
        
        if (data.poll_options) {
          let total = 0;
          if (data.type === 'yes/no') {
            total = data.poll_options.reduce((sum: number, option: PollOption) => {
              return sum + (option.yes_votes || 0) + (option.no_votes || 0) + (option.maybe_votes || 0);
            }, 0);
          } else {
            total = data.poll_options.reduce((sum: number, option: PollOption) => sum + (option.vote_count || 0), 0);
          }
          setTotalVote(total);
        }
        
        setLoading(false);

      } catch (err) {
        console.error('Error fetching poll:', err instanceof Error ? err.message : err);
        setLoading(false);
      }
    }

    fetchPoll();

  }, [pollId]);

  const deletePoll = async () => {
    try{
      const res = await fetch(`/api/polls/${pollId}`, {
        method: 'DELETE'
      });

      if(!res.ok) throw new Error(`HTTP ${res.status}`);

      setPoll(null)
    } 
    catch(err){
      console.error(err);
      alert('Failed to delete poll.')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!poll) {
    return (
      <PageShell size="md">
        <p className="text-center text-muted-foreground">Poll not found.</p>
      </PageShell>
    );
  }

  return(
    <div>
      {deleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
          <div className="w-80 space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-[0_8px_30px_rgba(26,31,54,0.12)]">
            <h2 className="text-xl font-semibold text-foreground">Delete poll?</h2>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <Button
                variant="destructive"
                onClick={async () => {
                  setDeleted(false);
                  setLoading(true);
                  try {
                    await deletePoll();
                    setTimeout(() => {
                      router.push('/dashboard');
                    }, 1000);
                  } catch {
                    router.push('/dashboard');
                  }
                }}
              >
                Delete
              </Button>
              <Button
                variant="secondary"
                onClick={() => setDeleted(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <PageShell size="xl">
        <div className="mb-8 space-y-4 border-b border-border pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
              {poll.title}
            </h1>
            <Badge variant="secondary" className="font-normal">
              {poll.type}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>
              Poll ID: <span className="font-mono text-foreground">{poll.poll_id}</span>
            </span>
            <span>
              Total votes: <span className="font-medium text-foreground">{totalVotes}</span>
            </span>
          </div>
          {poll.description && (
            <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {poll.description}
            </p>
          )}
        </div>

        {poll.type === "multi" && (
          <>
            <div className="mb-3 hidden grid-cols-3 gap-4 border-b border-border px-3 pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
              <p>Option</p>
              <p className="text-center">Votes</p>
              <p className="text-center">Percentage</p>
            </div>
            {Array.isArray(poll.poll_options) && poll.poll_options.map((opt) => { 
              const percentage = totalVotes > 0 ? (opt.vote_count / totalVotes * 100).toFixed(1) : '0';
              return (
                <div
                  key={opt.id}
                  className="mb-3 grid grid-cols-1 items-center gap-3 rounded-lg border border-border bg-background px-4 py-4 sm:grid-cols-3 sm:gap-4"
                >
                  <div className="flex flex-col items-start gap-2 sm:items-center">
                    {opt.image_url && (
                      <img 
                        src={opt.image_url} 
                        alt={opt.title} 
                        className="mb-1 h-16 w-16 object-contain"
                      />
                    )}
                    <p className="font-medium text-foreground">{opt.title}</p>
                    {opt.description && (
                      <p className="text-sm text-muted-foreground">{opt.description}</p>
                    )}
                  </div>
                  <p className="text-center text-lg text-foreground">{opt.vote_count}</p>
                  <p className="text-center text-lg font-semibold text-primary">{percentage}%</p>
                </div>
              );
            })}
          </>
        )}

        {poll.type === "yes/no" && (
          <>
            <div className="mb-3 hidden grid-cols-5 gap-4 border-b border-border px-3 pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
              <p>Option</p>
              <p className="text-center">Yes</p>
              <p className="text-center">No</p>
              <p className="text-center">Maybe</p>
              <p className="text-center">Net</p>
            </div>
            {Array.isArray(poll.poll_options) && poll.poll_options.map((opt) => { 
              return (
                <div
                  key={opt.id}
                  className="mb-3 grid grid-cols-1 items-center gap-3 rounded-lg border border-border bg-background px-4 py-4 sm:grid-cols-5 sm:gap-4"
                >
                  <div className="flex flex-col items-start gap-2 sm:items-center">
                    {opt.image_url && (
                      <img 
                        src={opt.image_url} 
                        alt={opt.title} 
                        className="mb-1 h-16 w-16 object-contain"
                      />
                    )}
                    <p className="text-center font-medium text-foreground">{opt.title}</p>
                    {opt.description && (
                      <p className="text-center text-sm text-muted-foreground">{opt.description}</p>
                    )}
                  </div>
                  <p className="text-center text-lg text-emerald-600">{opt.yes_votes || 0}</p>
                  <p className="text-center text-lg text-destructive">{opt.no_votes || 0}</p>
                  <p className="text-center text-lg text-muted-foreground">{opt.maybe_votes || 0}</p>
                  <p className="text-center text-lg font-semibold text-foreground">
                    {(opt.yes_votes || 0) - (opt.no_votes || 0)}
                  </p>
                </div>
              );
            })}
          </>
        )}

        {canDelete && (
          <div className="mt-8 flex justify-end border-t border-border pt-6">
            <Button
              variant="destructive"
              onClick={() => setDeleted(true)}
            >
              Delete poll
            </Button>
          </div>
        )}
      </PageShell>
    </div>
  )
}

export default PollResult;
