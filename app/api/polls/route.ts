import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createPoll } from '@/lib/db/polls';


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
    const payloadString = formData.get('payload') as string;
    
    if (!payloadString) {
      return NextResponse.json({ error: 'Missing payload in form-data' }, { status: 400 });
    }

    const { title, description, type, options } = JSON.parse(payloadString);

    // Generate a 6-digit poll ID (100000-999999)
    const generatePollId = () => {
      return Math.floor(Math.random() * 900000) + 100000;
    };

    let pollId = generatePollId();
    
    // Check if poll ID already exists and regenerate if needed
    const { data: existingPoll } = await supabase
      .from('polls')
      .select('poll_id')
      .eq('poll_id', pollId)
      .single();
    
    // If poll ID exists, try a few more times
    let attempts = 0;
    while (existingPoll && attempts < 5) {
      pollId = generatePollId();
      const { data: checkAgain } = await supabase
        .from('polls')
        .select('poll_id')
        .eq('poll_id', pollId)
        .single();
      if (!checkAgain) break;
      attempts++;
    }

    // Handle file uploads to Supabase Storage
    const pollOptions = await Promise.all(
      options.map(async (option: any, idx: number) => {
        let imageUrl = '';
        
        const file = formData.getAll('files')[idx] as File;

        if (file && file.size > 0) {
          // Upload to Supabase Storage
          const fileName = `poll-${pollId}-${idx}-${file.name}`;
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

    // Create poll and options using the new database structure
    const pollData = {
      poll_id: pollId,
      author: user.id,
      title,
      description: description,
      type,
    };

    const result = await createPoll(pollData, pollOptions);

    return NextResponse.json({ pollId: result.poll.poll_id, ...result }, { status: 201 });

  } catch (err) {
    console.error('Error creating poll:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
