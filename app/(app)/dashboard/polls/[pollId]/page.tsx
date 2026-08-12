'use client';

import {useState, useEffect} from "react";
import { useRouter } from 'next/navigation';
import { useParams } from "next/navigation";
import { createClient } from '@/lib/supabase/client';
import { isAdminUser } from '@/lib/utils';
import type { PollOption, PollWithOptions } from '@/lib/polls/types';
import { PageShell } from "@/components/layout/page-shell";
import { PollHeader } from "@/components/polls/poll-header";
import { PageEmptyState } from "@/components/shared/empty-state";
import { PollPageSkeleton } from "@/components/shared/loading-skeletons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

function PollResult () {
  const router = useRouter();
  const params = useParams();
  const pollId = params.pollId as string;

  const [totalVotes, setTotalVote] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [wasDeleted, setWasDeleted] = useState(false);

  const [poll, setPoll] = useState<PollWithOptions | null>(null);
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
    return <PollPageSkeleton size="xl" />;
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
      <PageEmptyState
        title="Poll not found"
        description="This poll may have been deleted, or the ID doesn’t match anything you can view."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
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
          <div className="mx-4 w-full max-w-xs space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-[0_8px_30px_rgba(26,31,54,0.12)]">
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
                {poll.type === "rank" ? "Total points" : "Total votes"}:{" "}
                <span className="font-medium text-foreground">{totalVotes}</span>
              </span>
            </div>
          }
        />

        {(poll.type === "multi" || poll.type === "rank") && (
          <>
            <div className="mb-3 hidden grid-cols-3 gap-4 border-b border-border px-3 pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
              <p>Option</p>
              <p className="text-center">{poll.type === "rank" ? "Points" : "Votes"}</p>
              <p className="text-center">Percentage</p>
            </div>
            {Array.isArray(poll.poll_options) && poll.poll_options.map((opt) => { 
              const percentage = totalVotes > 0 ? (opt.vote_count / totalVotes * 100).toFixed(1) : '0';
              const scoreLabel = poll.type === "rank" ? "Points" : "Votes";
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
                  <p className="text-center text-lg text-foreground">
                    <span className="mr-2 text-xs uppercase tracking-wide text-muted-foreground sm:hidden">
                      {scoreLabel}
                    </span>
                    {opt.vote_count}
                  </p>
                  <p className="text-center text-lg font-semibold text-primary">
                    <span className="mr-2 text-xs font-normal uppercase tracking-wide text-muted-foreground sm:hidden">
                      Share
                    </span>
                    {percentage}%
                  </p>
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
                  className="mb-3 grid grid-cols-2 items-center gap-3 rounded-lg border border-border bg-background px-4 py-4 sm:grid-cols-5 sm:gap-4"
                >
                  <div className="col-span-2 flex flex-col items-start gap-2 sm:col-span-1 sm:items-center">
                    {opt.image_url && (
                      <img 
                        src={opt.image_url} 
                        alt={opt.title} 
                        className="mb-1 h-16 w-16 object-contain"
                      />
                    )}
                    <p className="font-medium text-foreground sm:text-center">{opt.title}</p>
                    {opt.description && (
                      <p className="text-sm text-muted-foreground sm:text-center">{opt.description}</p>
                    )}
                  </div>
                  <p className="text-center text-lg text-emerald-600">
                    <span className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground sm:hidden">
                      Yes
                    </span>
                    {opt.yes_votes || 0}
                  </p>
                  <p className="text-center text-lg text-destructive">
                    <span className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground sm:hidden">
                      No
                    </span>
                    {opt.no_votes || 0}
                  </p>
                  <p className="text-center text-lg text-muted-foreground">
                    <span className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground sm:hidden">
                      Maybe
                    </span>
                    {opt.maybe_votes || 0}
                  </p>
                  <p className="text-center text-lg font-semibold text-foreground">
                    <span className="mb-1 block text-xs font-normal uppercase tracking-wide text-muted-foreground sm:hidden">
                      Net
                    </span>
                    {(opt.yes_votes || 0) - (opt.no_votes || 0)}
                  </p>
                </div>
              );
            })}
          </>
        )}

        {canDelete && (
          <div className="mt-8 flex justify-stretch border-t border-border pt-6 sm:justify-end">
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
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
