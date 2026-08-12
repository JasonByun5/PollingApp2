import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createPoll } from '@/lib/polls/db';
import { validateCreatePollPayload } from '@/lib/polls/validation';
import { MAX_FILE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from '@/lib/polls/uploads';


// creates a new poll, based on form-data submission
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceSupabase = createServiceClient(); // Add service client for storage

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const payloadString = formData.get('payload');

    if (typeof payloadString !== 'string' || !payloadString) {
      return NextResponse.json({ error: 'Missing payload in form-data' }, { status: 400 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(payloadString);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const validation = validateCreatePollPayload(parsed);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { title, description, type, options } = validation.data;

    // Validate all files up front so we fail fast, before uploading anything
    // or creating the poll, if any image is too large or an unsupported type.
    const submittedFiles = formData.getAll('files') as File[];
    for (const file of submittedFiles) {
      if (!file || file.size === 0) continue;
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: 'One of the images is too large (max 5MB)' }, { status: 400 });
      }
      if (!ALLOWED_IMAGE_TYPES[file.type]) {
        return NextResponse.json({ error: 'One of the files is not a supported image type (png, jpg, gif, webp)' }, { status: 400 });
      }
    }

    // Upload files before insert. Storage keys use a UUID only — poll_id is
    // allocated inside createPoll on successful insert (with conflict retries).
    const pollOptions = await Promise.all(
      options.map(async (option, idx) => {
        let imageUrl = '';
        
        const file = submittedFiles[idx];

        if (file && file.size > 0) {
          // Filename is generated server-side (never from the user-supplied
          // file.name) to avoid unsafe characters/path segments in the storage key.
          const extension = ALLOWED_IMAGE_TYPES[file.type];
          const fileName = `poll-${crypto.randomUUID()}.${extension}`;
          const { error: uploadError } = await serviceSupabase.storage
            .from('poll-images')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
          } else {
            // Get public URL
            const { data: publicUrlData } = serviceSupabase.storage
              .from('poll-images')
              .getPublicUrl(fileName);
            imageUrl = publicUrlData.publicUrl;
          }
        }

        return {
          title: option.name,
          description: option.description,
          vote_count: 0,
          image_url: imageUrl,
        };
      })
    );

    const result = await createPoll(
      {
        author: user.id,
        title,
        description,
        type,
      },
      pollOptions
    );

    return NextResponse.json({ pollId: result.poll.poll_id, ...result }, { status: 201 });

  } catch (err) {
    console.error('Error creating poll:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
