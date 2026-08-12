'use client';

import {useState, useEffect} from "react";
import { useRouter } from 'next/navigation';
import type { PollType } from '@/lib/poll-types';
import { AuthGate } from "@/components/auth/auth-gate";
import type { AuthUser } from "@/hooks/use-require-auth";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Poll = {
  title: string;
  poll_id: string;
  type: PollType;
  created_at: string;
};

const PAGE_SIZE = 20;

function DashboardPolls({ user }: { user: AuthUser }) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserPolls = async () => {
      try {
        const res = await fetch(
          `/api/polls/by-author/${user.id}?limit=${PAGE_SIZE}&offset=0`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch polls");
        }

        const data = await res.json();
        setPolls(data.polls ?? []);
        setHasMore(Boolean(data.hasMore));
        setOffset(PAGE_SIZE);
      } catch (err) {
        console.error(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    fetchUserPolls();
  }, [user.id]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/polls/by-author/${user.id}?limit=${PAGE_SIZE}&offset=${offset}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch polls");
      }

      const data = await res.json();
      setPolls((prev) => [...prev, ...(data.polls ?? [])]);
      setHasMore(Boolean(data.hasMore));
      setOffset((prev) => prev + PAGE_SIZE);
    } catch (err) {
      console.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <PageShell size="xl">
      <PageHeader
        title="Your polls"
        description="Browse and open results for polls you've created."
        action={
          <Button onClick={() => router.push('/create')}>
            Create poll
            <span aria-hidden="true">→</span>
          </Button>
        }
      />

      {polls.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="text-muted-foreground">No polls yet.</p>
          <Button className="mt-4" onClick={() => router.push('/create')}>
            Create your first poll
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="hidden grid-cols-[1.5fr_1fr_0.8fr_0.8fr_auto] gap-4 border-b border-border bg-secondary/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
            <span>Title</span>
            <span>Poll ID</span>
            <span>Type</span>
            <span>Created</span>
            <span className="text-right">Results</span>
          </div>

          <ul className="divide-y divide-border">
            {polls.map((poll: Poll) => (
              <li
                key={poll.poll_id}
                className="grid grid-cols-1 gap-2 px-4 py-4 transition-colors hover:bg-secondary/40 sm:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_auto] sm:items-center sm:gap-4"
              >
                <p className="font-medium text-foreground">{poll.title}</p>
                <p className="truncate font-mono text-sm text-muted-foreground">{poll.poll_id}</p>
                <div>
                  <Badge variant="secondary" className="font-normal">
                    {poll.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(poll.created_at).toLocaleDateString()}
                </p>
                <div className="sm:text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/polls/${poll.poll_id}`)}
                  >
                    View
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </PageShell>
  );
}

export default function ViewPoll() {
  return (
    <AuthGate description="Sign in to view your polls.">
      {(user) => <DashboardPolls user={user} />}
    </AuthGate>
  );
}
