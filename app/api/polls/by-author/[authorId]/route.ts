import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PAGE_SIZE, getPollsByAuthor, MAX_PAGE_SIZE } from '@/lib/db/polls';
import { isAdminUser } from '@/lib/utils';

function parsePositiveInt(value: string | null, fallback: number) {
  if (value === null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ authorId: string }> }
) {
  try {
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

    const { searchParams } = request.nextUrl;
    const limit = Math.min(
      parsePositiveInt(searchParams.get('limit'), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE
    );
    const offset = parsePositiveInt(searchParams.get('offset'), 0);

    const result = await getPollsByAuthor(authorIdStr, { limit, offset });
    return NextResponse.json(result);
  } catch (err) {
    console.error('Error fetching author polls:', err);
    return NextResponse.json({
      error: 'Failed to fetch polls',
      details: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
