
// /src/app/api/user-posts/[postId]/like/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseClient'; // Ensure this path is correct
import type { UserPost } from '@/types';

export const dynamic = 'force-dynamic';

interface LikeTogglePayload {
  userId: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  const { postId } = params;
  console.log(`[API /api/user-posts/${postId}/like POST] Request received.`);

  if (!supabaseAdmin) {
    console.error(`[API /api/user-posts/${postId}/like POST] Supabase ADMIN client is not initialized. Check SUPABASE_SERVICE_ROLE_KEY.`);
    return NextResponse.json({
      message: 'Database admin service not available. Cannot process like.',
      rawSupabaseError: { message: 'Supabase ADMIN client not initialized.' }
    }, { status: 503 });
  }

  if (!postId) {
    console.warn(`[API /api/user-posts/${postId}/like POST] Post ID is required.`);
    return NextResponse.json({ message: 'Post ID is required.' }, { status: 400 });
  }

  let payload: LikeTogglePayload;
  try {
    payload = await request.json();
  } catch (error) {
    console.error(`[API /api/user-posts/${postId}/like POST] Invalid JSON payload:`, error);
    return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 });
  }

  const { userId } = payload;
  if (!userId) {
    console.warn(`[API /api/user-posts/${postId}/like POST] User ID is required in payload.`);
    return NextResponse.json({ message: 'User ID is required to like a post.' }, { status: 400 });
  }
  console.log(`[API /api/user-posts/${postId}/like POST] User ${userId} attempting to like/unlike post ${postId}.`);

  try {
    // Step 1: Fetch the current post's like_count and liked_by_user_ids
    const { data: postData, error: fetchError } = await supabaseAdmin
      .from('user_posts')
      .select('liked_by_user_ids, like_count')
      .eq('id', postId)
      .single();

    if (fetchError) {
      console.error(`[API /api/user-posts/${postId}/like POST] Supabase error fetching post:`, fetchError);
      if (fetchError.code === 'PGRST116') { // Row not found
        return NextResponse.json({ message: 'Post not found.', rawSupabaseError: fetchError }, { status: 404 });
      }
      return NextResponse.json({ message: 'Failed to fetch post data.', rawSupabaseError: fetchError }, { status: 500 });
    }
    if (!postData) {
        return NextResponse.json({ message: 'Post not found (no data).' }, { status: 404 });
    }

    let currentLikedBy = postData.liked_by_user_ids || [];
    if (!Array.isArray(currentLikedBy)) { // Ensure it's an array
        console.warn(`[API /api/user-posts/${postId}/like POST] liked_by_user_ids was not an array for post ${postId}. Resetting. Current value:`, currentLikedBy);
        currentLikedBy = [];
    }

    const userHasLiked = currentLikedBy.includes(userId);
    let updatedLikedBy: string[];
    let updatedLikeCount: number;

    if (userHasLiked) {
      // User is unliking
      updatedLikedBy = currentLikedBy.filter((id) => id !== userId);
    } else {
      // User is liking
      updatedLikedBy = [...currentLikedBy, userId];
    }
    // Ensure like_count matches the array length
    updatedLikeCount = updatedLikedBy.length;


    // Step 2: Update the post with new like_count and liked_by_user_ids
    const { data: updatedPostFull, error: updateError } = await supabaseAdmin
      .from('user_posts')
      .update({
        liked_by_user_ids: updatedLikedBy,
        like_count: updatedLikeCount,
        // updated_at will be handled by the database trigger
      })
      .eq('id', postId)
      .select('id, like_count, liked_by_user_ids, user:users(name, email, "avatarUrl"), image_url, caption, product_tags, status, created_at, updated_at, user_id') // Select more fields for optimistic update
      .single();

    if (updateError) {
      console.error(`[API /api/user-posts/${postId}/like POST] Supabase error updating post likes:`, updateError);
      return NextResponse.json({ message: 'Failed to update like status.', rawSupabaseError: updateError }, { status: 500 });
    }
    if (!updatedPostFull) {
       console.error(`[API /api/user-posts/${postId}/like POST] Update returned no data for post ${postId}.`);
       return NextResponse.json({ message: 'Failed to update like status, post not found after update.' }, { status: 404 });
    }
    
    // Derive user_name consistently
    let displayName = 'Anonymous';
    // @ts-ignore
    if (updatedPostFull.user && updatedPostFull.user.name && updatedPostFull.user.name.trim() !== '') {
        // @ts-ignore
        displayName = updatedPostFull.user.name;
    // @ts-ignore
    } else if (updatedPostFull.user && updatedPostFull.user.email && updatedPostFull.user.email.trim() !== '') {
        // @ts-ignore
        displayName = updatedPostFull.user.email.split('@')[0];
    } else if (updatedPostFull.user_id) {
        displayName = `${updatedPostFull.user_id.substring(0, 4)}...${updatedPostFull.user_id.substring(updatedPostFull.user_id.length - 4)}`;
    }
    
    const responsePost: UserPost = {
        id: updatedPostFull.id,
        user_id: updatedPostFull.user_id,
        user_name: displayName,
        // @ts-ignore
        user_avatar_url: updatedPostFull.user?.avatarUrl,
        image_url: updatedPostFull.image_url,
        caption: updatedPostFull.caption,
        product_tags: updatedPostFull.product_tags,
        status: updatedPostFull.status as UserPost['status'],
        like_count: updatedPostFull.like_count,
        liked_by_user_ids: updatedPostFull.liked_by_user_ids,
        created_at: updatedPostFull.created_at,
        updated_at: updatedPostFull.updated_at,
    };


    console.log(`[API /api/user-posts/${postId}/like POST] Like status updated successfully for post ${postId}. User ${userHasLiked ? 'unliked' : 'liked'}. New count: ${updatedLikeCount}`);
    return NextResponse.json(responsePost);

  } catch (e: any) {
    console.error(`[API /api/user-posts/${postId}/like POST] Unhandled error:`, e);
    return NextResponse.json({ message: 'Server error processing like request.', errorName: e.name, errorMessage: e.message }, { status: 500 });
  }
}
