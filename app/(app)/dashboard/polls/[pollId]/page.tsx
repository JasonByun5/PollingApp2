'use client';

import {useState, useEffect} from "react";
import { useRouter } from 'next/navigation';
import { useParams } from "next/navigation";
import { createClient } from '@/lib/supabase/client';
import { isAdminUser } from '@/lib/utils';
import type { PollType } from '@/lib/poll-types';
import { PageShell } from "@/components/page-shell";
import { PollHeader } from "@/components/poll-header";
import { Button } from "@/components/ui/button";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [wasDeleted, setWasDeleted] = useState(false);

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

  useEffect(() => {
    if (!wasDeleted) return;
    const timeout = window.setTimeout(() => {
      router.push("/dashboard");
    }, 1600);
    return () => window.clearTimeout(timeout);
  }, [wasDeleted, router]);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setShowDeleteConfirm(false);
      setWasDeleted(true);
    } catch (err) {
      console.error(err);
      setDeleteError("Failed to delete poll. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (wasDeleted) {
    return (
      <PageShell size="md">
        <div className="space-y-4 text-center">
          <h2 className="text-xl font-semibold text-foreground">Poll deleted</h2>
          <p className="text-muted-foreground">
            Taking you back to your dashboard…
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </PageShell>
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
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-poll-title"
        >
          <div className="w-80 space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-[0_8px_30px_rgba(26,31,54,0.12)]">
            <h2 id="delete-poll-title" className="text-xl font-semibold text-foreground">
              Delete poll?
            </h2>
            <p className="text-sm text-muted-foreground">
              This permanently removes the poll and its votes. This cannot be undone.
            </p>
            {deleteError && (
              <p role="alert" className="text-sm text-destructive">
                {deleteError}
              </p>
            )}
            <div className="flex justify-center gap-3">
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </Button>
              <Button
                variant="secondary"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <PageShell size="xl">
        <PollHeader
          title={poll.title}
          type={poll.type}
          description={poll.description}
          meta={
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span>
                Poll ID:{" "}
                <span className="font-mono text-foreground">{poll.poll_id}</span>
              </span>
              <span>
                Total votes:{" "}
                <span className="font-medium text-foreground">{totalVotes}</span>
              </span>
            </div>
          }
        />

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
              onClick={() => {
                setDeleteError(null);
                setShowDeleteConfirm(true);
              }}
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
