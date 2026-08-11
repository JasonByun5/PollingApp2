'use client';

import {useState, useEffect} from "react";
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { PollType } from '@/lib/poll-types';
import { PageShell, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type User = {
  id: string;
  email: string;
};

type Poll = {
  title: string;
  poll_id: string;
  type: PollType;
  created_at: string;
};

const PAGE_SIZE = 20;

function ViewPoll () {
  const [user, setUser] = useState<User | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getClaims();
      const user = data?.claims;
      
      if (user) {
        setUser({
          id: user.sub,
          email: user.email || ''
        });
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);
  
  useEffect(() => {
    if (!user) return;

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
  }, [user]);

  const handleLoadMore = async () => {
    if (!user || isLoadingMore || !hasMore) return;

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

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <PageShell size="md">
        <div className="space-y-4 text-center">
          <h2 className="text-xl font-semibold text-foreground">Not logged in</h2>
          <p className="text-muted-foreground">Sign in to view your polls.</p>
          <Button onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </div>
      </PageShell>
    );
  }

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

export default ViewPoll;
