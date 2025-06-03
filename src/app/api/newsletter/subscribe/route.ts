
// /src/app/api/newsletter/subscribe/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, supabase as fallbackSupabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

interface SubscribePayload {
  email: string;
  source?: string;
}

export async function POST(request: NextRequest) {
  const client = supabaseAdmin || fallbackSupabase;
  if (!client) {
    console.error('[API Newsletter Subscribe POST] Supabase client is not initialized.');
    return NextResponse.json({ message: 'Database service not available.' }, { status: 503 });
  }
  // Log which client is being used for debugging RLS issues if they arise
  // console.log(`[API Newsletter Subscribe POST] Using ${client === supabaseAdmin ? 'ADMIN client (service_role)' : 'FALLBACK public client'}.`);

  let payload: SubscribePayload;
  try {
    payload = await request.json();
  } catch (e) {
    return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 });
  }

  const { email, source } = payload;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ message: 'A valid email address is required.' }, { status: 400 });
  }

  try {
    const { data, error } = await client
      .from('newsletter_subscriptions')
      .insert({
        email: email.toLowerCase().trim(),
        source: source || 'unknown',
        is_active: true, // Default to active
      })
      .select() // Select the inserted row to confirm and potentially return
      .single(); // Expect only one row or error if unique constraint violated

    if (error) {
      if (error.code === '23505') { // Unique constraint violation (email already exists)
        // Optionally, update `is_active` to true if they re-subscribe and were inactive
        // For now, just treat as success/already subscribed
        console.log(`[API Newsletter Subscribe POST] Email already subscribed: ${email}`);
        return NextResponse.json({ message: 'You are already subscribed! Thank you.' }, { status: 200 });
      }
      console.error('[API Newsletter Subscribe POST] Supabase error inserting subscription:', error);
      return NextResponse.json({ message: `Failed to subscribe: ${error.message}`, rawSupabaseError: error }, { status: 500 });
    }

    if (!data) {
        // This case might not be hit if insert fails due to policy or other reasons without throwing a 23505.
        console.warn(`[API Newsletter Subscribe POST] Insert succeeded for ${email} but no data returned. This is unexpected.`);
        return NextResponse.json({ message: 'Subscription processed, but no confirmation data received.' }, { status: 200 });
    }

    console.log(`[API Newsletter Subscribe POST] Email subscribed successfully: ${email}`);
    return NextResponse.json({ message: 'Successfully subscribed! Welcome to Peak Pulse.', data }, { status: 201 });

  } catch (e: any) {
    console.error('[API Newsletter Subscribe POST] Unhandled error:', e);
    return NextResponse.json({ message: 'An unexpected error occurred during subscription.', error: e.message }, { status: 500 });
  }
}
    