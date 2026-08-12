import type { PollType } from '@/lib/poll-types';

export interface PollOption {
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

export interface Poll {
  id: string;
  poll_id: number;
  author: string;
  title: string;
  description: string;
  type: PollType;
  created_at: string;
}

export interface PollWithOptions extends Poll {
  poll_options: PollOption[];
}

export interface Vote {
  id: string;
  poll_id: number;
  option_id: string;
  user_id: string;
  vote_type?: 'yes' | 'no' | 'maybe' | 'multi';
  created_at: string;
}
