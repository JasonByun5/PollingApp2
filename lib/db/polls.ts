import { createServiceClient } from '@/lib/supabase/server';
import type { Poll, PollOption, PollWithOptions, Vote } from '@/lib/types';

export type { PollType } from '@/lib/poll-types';
export { POLL_TYPES, isPollType } from '@/lib/poll-types';
export type { Poll, PollOption, PollWithOptions, Vote } from '@/lib/types';

const POLL_ID_MAX_ATTEMPTS = 8;

function generatePollId() {
  return Math.floor(Math.random() * 900000) + 100000;
}

function isUniqueViolation(error: { code?: string } | null | undefined) {
  // Postgres unique_violation — surfaced by PostgREST/Supabase as code 23505
  return error?.code === '23505';
}

export async function createPoll(
  pollData: Omit<Poll, 'id' | 'poll_id' | 'created_at'>,
  options: Omit<PollOption, 'id' | 'poll_id' | 'created_at'>[]
) {
  const supabase = createServiceClient(); // Use service client to bypass RLS

  // Allocate poll_id by attempting insert and retrying on unique conflicts.
  // Check-then-insert races under concurrent creates; the DB unique constraint
  // is the source of truth.
  let poll: Poll | null = null;
  for (let attempt = 0; attempt < POLL_ID_MAX_ATTEMPTS; attempt++) {
    const pollId = generatePollId();
    const { data, error: pollError } = await supabase
      .from('polls')
      .insert({
        poll_id: pollId,
        author: pollData.author,
        title: pollData.title,
        description: pollData.description,
        type: pollData.type,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!pollError && data) {
      poll = data;
      break;
    }
    if (!isUniqueViolation(pollError)) {
      throw pollError;
    }
  }

  if (!poll) {
    throw new Error('Could not allocate a unique poll ID');
  }

  // Then, create the poll options
  const pollOptions = options.map(option => ({
    poll_id: poll.poll_id,
    title: option.title,
    description: option.description,
    vote_count: option.vote_count || 0,
    image_url: option.image_url || '',
    created_at: new Date().toISOString()
  }));

  const { data: createdOptions, error: optionsError } = await supabase
    .from('poll_options')
    .insert(pollOptions)
    .select();

  if (optionsError) {
    // If options creation fails, we should clean up the poll
    await supabase.from('polls').delete().eq('id', poll.id);
    throw optionsError;
  }

  return { poll, options: createdOptions };
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export type PollListParams = {
  limit?: number;
  offset?: number;
};

export type PollListResult = {
  polls: PollWithOptions[];
  limit: number;
  offset: number;
  hasMore: boolean;
};

function normalizePagination(params?: PollListParams) {
  const offset = Math.max(0, Math.floor(params?.offset ?? 0));
  let limit = params?.limit ?? DEFAULT_PAGE_SIZE;
  if (!Number.isFinite(limit) || limit < 1) {
    limit = DEFAULT_PAGE_SIZE;
  }
  limit = Math.min(Math.floor(limit), MAX_PAGE_SIZE);
  return { limit, offset };
}

export async function getAllPolls(params?: PollListParams): Promise<PollListResult> {
  const supabase = createServiceClient();
  const { limit, offset } = normalizePagination(params);

  // Fetch one extra row to detect whether another page exists.
  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select(`
      *,
      poll_options (*)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit);

  if (pollsError) throw pollsError;

  const rows = polls || [];
  const hasMore = rows.length > limit;

  return {
    polls: hasMore ? rows.slice(0, limit) : rows,
    limit,
    offset,
    hasMore,
  };
}

export async function getPollById(pollId: number): Promise<PollWithOptions> {
  const supabase = createServiceClient();
  
  const { data: poll, error } = await supabase
    .from('polls')
    .select(`
      *,
      poll_options (*)
    `)
    .eq('poll_id', pollId)
    .single();

  if (error) throw error;
  return poll;
}

export async function getPollsByAuthor(
  author: string,
  params?: PollListParams
): Promise<PollListResult> {
  const supabase = createServiceClient();
  const { limit, offset } = normalizePagination(params);

  const { data: polls, error } = await supabase
    .from('polls')
    .select(`
      *,
      poll_options (*)
    `)
    .eq('author', author)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit);

  if (error) throw error;

  const rows = polls || [];
  const hasMore = rows.length > limit;

  return {
    polls: hasMore ? rows.slice(0, limit) : rows,
    limit,
    offset,
    hasMore,
  };
}

export async function updatePollVotes(pollId: number, optionId: string, userId?: string, voteType?: 'yes' | 'no' | 'maybe') {
  const supabase = createServiceClient();
  
  // For yes/no/maybe polls, update specific vote counter
  if (voteType) {
    // Add the vote record with proper vote_type
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: userId || 'anonymous',
        vote_type: voteType,
        created_at: new Date().toISOString()
      });

    if (voteError) throw voteError;

    // Get current vote counts
    const { data: currentOption, error: fetchError } = await supabase
      .from('poll_options')
      .select('yes_votes, no_votes, maybe_votes')
      .eq('id', optionId)
      .single();

    if (fetchError) throw fetchError;

    // Prepare update based on vote type
    const updateData: { [key: string]: number } = {};
    switch (voteType) {
      case 'yes':
        updateData.yes_votes = (currentOption.yes_votes || 0) + 1;
        break;
      case 'no':
        updateData.no_votes = (currentOption.no_votes || 0) + 1;
        break;
      case 'maybe':
        updateData.maybe_votes = (currentOption.maybe_votes || 0) + 1;
        break;
    }

    // Update the specific vote counter
    const { data, error } = await supabase
      .from('poll_options')
      .update(updateData)
      .eq('id', optionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // For regular polls (multi/rank), increment vote count
  // If userId is provided, add a vote record
  if (userId) {
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: userId,
        vote_type: 'multi',
        created_at: new Date().toISOString()
      });

    if (voteError) throw voteError;
  }

  // First get the current vote count
  const { data: currentOption, error: fetchError } = await supabase
    .from('poll_options')
    .select('vote_count')
    .eq('id', optionId)
    .single();

  if (fetchError) throw fetchError;

  // Increment the vote count
  const newVoteCount = (currentOption.vote_count || 0) + 1;

  // Update the option with the new vote count
  const { data, error } = await supabase
    .from('poll_options')
    .update({ 
      vote_count: newVoteCount
    })
    .eq('id', optionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Records a full ranking with Borda scoring: 1st gets n points, 2nd n-1, etc.
 * Inserts one vote row per option so hasUserVoted still works on the next attempt.
 */
export async function updateRankVotes(
  pollId: number,
  ranking: string[],
  userId: string
) {
  const supabase = createServiceClient();
  const poll = await getPollById(pollId);

  if (poll.type !== 'rank') {
    throw new Error('Poll is not a rank poll');
  }

  const optionIds = new Set(poll.poll_options.map((o) => o.id));
  if (ranking.length !== poll.poll_options.length) {
    throw new Error('Ranking must include every option exactly once');
  }
  if (new Set(ranking).size !== ranking.length) {
    throw new Error('Ranking contains duplicate options');
  }
  if (ranking.some((id) => !optionIds.has(id))) {
    throw new Error('Ranking contains an invalid option');
  }

  const n = ranking.length;
  const updatedOptions = [];

  for (let i = 0; i < ranking.length; i++) {
    const optionId = ranking[i];
    const points = n - i;

    const { error: voteError } = await supabase.from('votes').insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: userId,
      vote_type: 'multi',
      created_at: new Date().toISOString(),
    });

    if (voteError) throw voteError;

    const { data: currentOption, error: fetchError } = await supabase
      .from('poll_options')
      .select('vote_count')
      .eq('id', optionId)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('poll_options')
      .update({
        vote_count: (currentOption.vote_count || 0) + points,
      })
      .eq('id', optionId)
      .select()
      .single();

    if (error) throw error;
    updatedOptions.push(data);
  }

  return updatedOptions;
}

// Check if user has already voted on a poll
export async function hasUserVoted(pollId: number, userId: string): Promise<boolean> {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('votes')
    .select('id')
    .eq('poll_id', pollId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return !!data;
}

// Get user's vote for a specific poll
export async function getUserVote(pollId: number, userId: string): Promise<Vote | null> {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('poll_id', pollId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Delete a poll and its associated options and votes
export async function deletePoll(pollId: number) {
  const supabase = createServiceClient();
  
  // Delete votes first (due to foreign key constraints)
  const { error: votesError } = await supabase
    .from('votes')
    .delete()
    .eq('poll_id', pollId);

  if (votesError) throw votesError;

  // Get options to delete associated images
  const { data: options } = await supabase
    .from('poll_options')
    .select('image_url')
    .eq('poll_id', pollId);

  // Delete images from storage
  if (options && options.length > 0) {
    for (const option of options) {
      if (option.image_url) {
        try {
          const urlParts = option.image_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          await supabase.storage.from('poll-images').remove([fileName]);
        } catch (storageError) {
          console.error('Error deleting image:', storageError);
        }
      }
    }
  }

  // Delete poll options
  const { error: optionsError } = await supabase
    .from('poll_options')
    .delete()
    .eq('poll_id', pollId);

  if (optionsError) throw optionsError;

  // Finally, delete the poll
  const { error: pollError } = await supabase
    .from('polls')
    .delete()
    .eq('poll_id', pollId);

  if (pollError) throw pollError;
  return true;
}
