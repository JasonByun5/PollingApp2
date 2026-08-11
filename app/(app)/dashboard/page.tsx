'use client';

import {useState, useEffect} from "react";
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { PollType } from '@/lib/poll-types';

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

  //checks for user auth
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
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return(
      <div>
        not logged in!
      </div>
    )
  }

  return(
    
    <div>
      <div className="flex justify-center p-10 text-lg">
        <div className="w-3/5 bg-red-50 px-20 py-10 rounded-2xl flex flex-col shadow-md">
          <p className="mb-3 font-bold underline">Previous Polls:</p>
          <div className="w-full bg-gray-100 p-3 rounded-lg mb-5 grid grid-cols-5 gap-1 underline font-bold">
              <p>Title</p> 
              <p>Poll ID</p>
              <p> Poll Type </p>
              <p> Created At </p>
              <p>See Polls</p>
            </div>
          {polls.map((poll: Poll) => (
            <div key={poll.poll_id} className="w-full bg-gray-100 p-3 rounded-lg mb-5 grid grid-cols-5 gap-1">
              <p>{poll.title}</p>
              <p>{poll.poll_id}</p>
              <p> {poll.type} </p>
              <p> {new Date(poll.created_at).toLocaleDateString()}</p>
               <button 
                  type="button" 
                  className="bg-red-200 rounded-full text-xl"
                  onClick={() => router.push(`/dashboard/polls/${poll.poll_id}`)}
                >📊</button>
            </div>
          ))}
          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="self-center bg-red-200 rounded px-4 py-2 disabled:opacity-50"
            >
              {isLoadingMore ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      </div>
    </div>

  )

}
export default ViewPoll;
