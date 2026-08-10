import { NextRequest, NextResponse } from 'next/server';
import { getPollById, deletePoll, updatePollVotes, hasUserVoted } from '@/lib/db/polls';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/utils';

const VOTER_COOKIE = 'pollify_voter_id';
const VOTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// GET single poll by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const resolvedParams = await params;
    
    console.log('Full params object:', resolvedParams);
    console.log('Raw pollId:', resolvedParams.pollId, 'Type:', typeof resolvedParams.pollId);
    
    const pollIdStr = resolvedParams.pollId;
    if (!pollIdStr || pollIdStr === 'undefined') {
      return NextResponse.json({ error: 'Invalid poll ID' }, { status: 400 });
    }
    
    const pollIdNum = parseInt(pollIdStr, 10);
    if (isNaN(pollIdNum)) {
      return NextResponse.json({ 
        error: 'Invalid poll ID format', 
        received: pollIdStr,
        parsed: pollIdNum 
      }, { status: 400 });
    }
    
    console.log('Searching for poll_id:', pollIdNum, 'from string:', pollIdStr);
    
    const poll = await getPollById(pollIdNum);

    console.log('Found poll:', poll?.title);
    return NextResponse.json(poll);
  } catch (err) {
    console.error('Error fetching poll:', err);
    return NextResponse.json({ 
      error: 'Poll not found', 
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 404 });
  }
}

//updates votes for yes/no/maybe polls
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    const pollIdNum = parseInt(resolvedParams.pollId, 10);
    if (isNaN(pollIdNum)) {
      return NextResponse.json({ error: 'Invalid poll ID format' }, { status: 400 });
    }

    // Determine who's voting: real user if logged in, otherwise a
    // persistent anonymous cookie ID. Never trust a userId sent by the client.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const existingVoterCookie = request.cookies.get(VOTER_COOKIE)?.value;
    const voterId = user?.id ?? existingVoterCookie ?? crypto.randomUUID();
    const shouldSetVoterCookie = !user && !existingVoterCookie;

    if (await hasUserVoted(pollIdNum, voterId)) {
      return NextResponse.json({ error: 'You have already voted on this poll' }, { status: 409 });
    }

    let response: NextResponse;

    // Handle single vote (for multi/rank polls)
    if (body.optionId) {
      const { optionId } = body;
      if (!optionId) {
        return NextResponse.json({ error: 'Option ID is required' }, { status: 400 });
      }

      const updatedOption = await updatePollVotes(pollIdNum, optionId, voterId);

      response = NextResponse.json({
        message: 'Vote recorded successfully',
        option: updatedOption
      });
    } else if (body.votes) {
      // Handle multiple votes (for yes/no polls)
      const { votes } = body; // votes = {optionId: 'yes'|'no'|'maybe'}

      if (Object.keys(votes).length === 0) {
        return NextResponse.json({ error: 'No votes provided' }, { status: 400 });
      }

      // Store each vote separately in the database
      const votePromises = Object.entries(votes).map(async ([optionId, voteType]) => {
        return await updatePollVotes(pollIdNum, optionId, voterId, voteType as 'yes' | 'no' | 'maybe');
      });

      await Promise.all(votePromises);

      response = NextResponse.json({
        message: 'All votes recorded successfully',
        votesCount: Object.keys(votes).length
      });
    } else {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    if (shouldSetVoterCookie) {
      response.cookies.set(VOTER_COOKIE, voterId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: VOTER_COOKIE_MAX_AGE,
        path: '/',
      });
    }

    return response;
  } catch (err) {
    console.error('Error updating votes:', err);
    return NextResponse.json({ 
      error: 'Failed to update votes',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE poll by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const resolvedParams = await params;
    const pollIdNum = parseInt(resolvedParams.pollId, 10);

    if (isNaN(pollIdNum)) {
      return NextResponse.json({ error: 'Invalid poll ID format' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const poll = await getPollById(pollIdNum);
    const isOwner = poll.author === user.id;
    const isAdmin = isAdminUser(user);


    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: not the poll owner or an admin' }, { status: 403 });
    }

    await deletePoll(pollIdNum);

    return NextResponse.json({ message: 'Poll deleted successfully' });
  } catch (err) {
    console.error('Error deleting poll:', err);
    return NextResponse.json({ 
      error: 'Failed to delete poll',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}