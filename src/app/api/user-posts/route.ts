
// /src/app/api/user-posts/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase, supabaseAdmin } from '../../../lib/supabaseClient.ts'; // Import both
import type { UserPost } from '@/types';

export const dynamic = 'force-dynamic';

// GET approved user posts for frontend display
export async function GET(request: NextRequest) {
  console.log("[API /api/user-posts GET] request received for approved posts.");

  if (!supabase) { // Use public client for public reads
    console.error('[API /api/user-posts GET] Supabase public client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({
      message: 'Database service not available. Cannot fetch posts.',
      rawSupabaseError: { message: 'Supabase public client not initialized on server for GET. Check server logs and environment variables.' }
    }, { status: 503 });
  }

  try {
    const { data, error } = await supabase // Use public client
      .from('user_posts')
      .select(`
        id,
        user_id,
        image_url,
        caption,
        product_tags,
        status,
        created_at,
        updated_at,
        user:users ( name, "avatarUrl" ) 
      `)
      .eq('status', 'approved') // Rely on RLS for this, or filter here
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API /api/user-posts GET] Supabase error fetching approved posts:', error);
      return NextResponse.json({
        message: 'Failed to fetch user posts from database.',
        rawSupabaseError: { 
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
      }, { status: 500 });
    }
    
    const posts: UserPost[] = (data || []).map((post: any) => ({ 
        id: post.id,
        user_id: post.user_id,
        user_name: post.user?.name || 'Peak Pulse User', 
        user_avatar_url: post.user?.avatarUrl || undefined,
        image_url: post.image_url,
        caption: post.caption,
        product_tags: post.product_tags,
        status: post.status as UserPost['status'],
        created_at: post.created_at,
        updated_at: post.updated_at,
    }));

    console.log(`[API /api/user-posts GET] Successfully fetched ${posts.length} approved posts.`);
    return NextResponse.json(posts);
  } catch (e) {
    const error = e as Error;
    console.error('[API /api/user-posts GET] Unhandled error in GET handler:', error);
    return NextResponse.json({
      message: 'Server error while fetching user posts.',
      errorName: error.name,
      errorMessage: error.message,
    }, { status: 500 });
  }
}

// POST to create a new user post (submitted by users)
interface CreateUserPostPayload {
  userId: string; // Firebase UID
  imageUrl: string;
  caption?: string | null; // Allow null from client
  productTags?: string[] | null; // Allow null from client
}
export async function POST(request: NextRequest) {
  console.log("[API /api/user-posts POST] request received to create user post.");

  if (!supabaseAdmin) { // Use ADMIN client for inserts to bypass RLS if user_id is trusted from client
    console.error('[API /api/user-posts POST] Supabase ADMIN client is not initialized. Check SUPABASE_SERVICE_ROLE_KEY and server restart.');
    return NextResponse.json({
      message: 'Database service not available. Cannot create post.',
      rawSupabaseError: { message: 'Supabase ADMIN client not initialized on server for POST. Check server logs and environment variables.' }
    }, { status: 503 });
  }

  let payload: CreateUserPostPayload;
  try {
    payload = await request.json();
  } catch (error) {
    console.error('[API /api/user-posts POST] Invalid JSON payload:', error);
    return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 });
  }

  const { userId, imageUrl, caption, productTags } = payload;
  
  console.log(`[API /api/user-posts POST] RAW PAYLOAD - userId: '${userId}', imageUrl: '${imageUrl}', caption: '${caption}', productTags:`, productTags);

  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    const message = `Invalid userId: '${userId}'. Must be a non-empty string.`;
    console.warn(`[API /api/user-posts POST] VALIDATION FAILED: ${message}`);
    return NextResponse.json({ message }, { status: 400 });
  }
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    const message = `Invalid imageUrl: '${imageUrl}'. Must be a non-empty string.`;
    console.warn(`[API /api/user-posts POST] VALIDATION FAILED: ${message}`);
    return NextResponse.json({ message }, { status: 400 });
  }

  const newPostData = {
    user_id: userId.trim(),
    image_url: imageUrl.trim(),
    caption: caption || null,
    product_tags: productTags && productTags.length > 0 ? productTags : null,
    status: 'pending' as const,
  };

  console.log('[API /api/user-posts POST] DATA PREPARED FOR SUPABASE INSERT:', JSON.stringify(newPostData, null, 2));

  try {
    const { data, error: insertError } = await supabaseAdmin // Use ADMIN client
      .from('user_posts')
      .insert(newPostData)
      .select()
      .single();

    if (insertError) {
      console.error('[API /api/user-posts POST] Supabase error creating post:', insertError);
      return NextResponse.json({
        message: 'Failed to create post in database.',
        rawSupabaseError: {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
        },
      }, { status: 500 });
    }

    console.log('[API /api/user-posts POST] User post created successfully:', data);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const error = e as Error;
    console.error('[API /api/user-posts POST] Unhandled exception during post creation:', error);
    return NextResponse.json({
      message: 'Server error while creating user post.',
      errorName: error.name,
      errorMessage: error.message,
    }, { status: 500 });
  }
}

    