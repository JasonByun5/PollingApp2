import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPollsByAuthor } from '@/lib/db/polls';
import { isAdminUser } from '@/lib/utils';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ authorId: string }> }
) {
  try{

    const resolvedParams = await params;
    const authorIdStr = resolvedParams.authorId;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (user.id !== authorIdStr && !isAdminUser(user)) {
      return NextResponse.json({ error: 'Forbidden: not your polls' }, { status: 403 });
    }

    const poll = await getPollsByAuthor(authorIdStr);
    return NextResponse.json(poll);


  }
  catch (err) {
    console.error('Error fetching author:', err);
    return NextResponse.json({ 
      error: 'Poll not found', 
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 404 });
  }

}