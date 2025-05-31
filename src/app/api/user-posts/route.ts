
// /src/app/api/user-posts/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabaseClient.ts';
import type { UserPost } from '@/types';

export const dynamic = 'force-dynamic';

// GET approved user posts for frontend display
export async function GET(request: NextRequest) {
  console.log("[API /api/user-posts GET] request received for approved posts.");

  if (!supabase) {
    console.error('[API /api/user-posts GET] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({
      message: 'Database service not available. Cannot fetch posts.',
      rawSupabaseError: { message: 'Supabase client not initialized on server for GET. Check server logs and environment variables.' }
    }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
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
        users ( 
          name,
          "avatarUrl"
        )
      `)
      .eq('status', 'approved')
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
    
    const posts: UserPost[] = (data || []).map((post: any) => ({ // Use 'any' for Supabase join result before mapping
        id: post.id,
        user_id: post.user_id,
        user_name: post.users?.name || 'Peak Pulse User', 
        user_avatar_url: post.users?.["avatarUrl"] || undefined,
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
  userId: string;
  imageUrl: string;
  caption?: string;
  productTags?: string[];
}
export async function POST(request: NextRequest) {
  console.log("[API /api/user-posts POST] request received to create user post.");

  if (!supabase) {
    console.error('[API /api/user-posts POST] Supabase client is not initialized. Check environment variables and server restart.');
    return NextResponse.json({
      message: 'Database service not available. Cannot create post.',
      rawSupabaseError: { message: 'Supabase client not initialized on server for POST. Check server logs and environment variables.' }
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
  console.log('[API /api/user-posts POST] Parsed Payload:', payload);


  if (!userId || !imageUrl) {
    console.warn('[API /api/user-posts POST] Missing required fields: userId or imageUrl.');
    return NextResponse.json({ message: 'User ID and Image URL are required.' }, { status: 400 });
  }

  const newPostData = {
    user_id: userId, 
    image_url: imageUrl,
    caption: caption || null,
    product_tags: productTags && productTags.length > 0 ? productTags : null,
    status: 'pending', // New posts default to pending
    // Supabase will handle created_at and updated_at
  };
  
  console.log('[API /api/user-posts POST] EXACT DATA FOR SUPABASE INSERT:', JSON.stringify(newPostData, null, 2));
  console.log(`[API /api/user-posts POST] typeof userId: ${typeof userId}, length: ${userId?.length}, value: ${userId}`);
  console.log(`[API /api/user-posts POST] typeof imageUrl: ${typeof imageUrl}, length: ${imageUrl?.length}, value: ${imageUrl}`);

  try {
    const { data, error: insertError } = await supabase
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
      }, { status: 500 }); // Use 500 for DB errors, or specific codes if applicable (e.g. 403 for RLS)
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
