
// /src/app/api/user-posts/[postId]/comments/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient'; // CORRECTED IMPORT PATH
import type { PostComment } from '@/types';

export const dynamic = 'force-dynamic';

interface CreateCommentPayload {
  userId: string;
  commentText: string;
}

// GET comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  const { postId } = params;
  console.log(`[API /api/user-posts/${postId}/comments GET] Request received.`);

  if (!supabaseAdmin) {
    console.error(`[API /api/user-posts/${postId}/comments GET] Supabase ADMIN client not initialized.`);
    return NextResponse.json({ message: 'Database admin service not available.' }, { status: 503 });
  }
  if (!postId) {
    return NextResponse.json({ message: 'Post ID is required.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('post_comments')
      .select(`
        id,
        post_id,
        user_id,
        comment_text,
        parent_comment_id,
        created_at,
        updated_at,
        user:users (name, "avatarUrl")
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`[API /api/user-posts/${postId}/comments GET] Supabase error fetching comments:`, error);
      return NextResponse.json({ message: 'Failed to fetch comments.', rawSupabaseError: error }, { status: 500 });
    }

    const comments: PostComment[] = (data || []).map((c: any) => ({
      id: c.id,
      post_id: c.post_id,
      user_id: c.user_id,
      user_name: c.user?.name || 'Anonymous',
      user_avatar_url: c.user?.avatarUrl,
      comment_text: c.comment_text,
      parent_comment_id: c.parent_comment_id,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));
    
    console.log(`[API /api/user-posts/${postId}/comments GET] Fetched ${comments.length} comments.`);
    return NextResponse.json(comments);
  } catch (e: any) {
    console.error(`[API /api/user-posts/${postId}/comments GET] Unhandled error:`, e);
    return NextResponse.json({ message: 'Server error fetching comments.', errorDetails: e.message }, { status: 500 });
  }
}

// POST a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  const { postId } = params;
  console.log(`[API /api/user-posts/${postId}/comments POST] Request received.`);

  if (!supabaseAdmin) {
    console.error(`[API /api/user-posts/${postId}/comments POST] Supabase ADMIN client not initialized.`);
    return NextResponse.json({ message: 'Database admin service not available.' }, { status: 503 });
  }

  if (!postId) {
    return NextResponse.json({ message: 'Post ID is required.' }, { status: 400 });
  }

  let payload: CreateCommentPayload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 });
  }

  const { userId, commentText } = payload;
  if (!userId || !commentText || commentText.trim() === '') {
    return NextResponse.json({ message: 'User ID and comment text are required.' }, { status: 400 });
  }
  
  console.log(`[API /api/user-posts/${postId}/comments POST] User ${userId} posting comment: "${commentText.substring(0,30)}..."`);

  const commentToInsert = {
    post_id: postId,
    user_id: userId,
    comment_text: commentText.trim(),
    // parent_comment_id can be added later if threaded comments are needed
  };

  try {
    const { data: insertedComment, error: insertError } = await supabaseAdmin
      .from('post_comments')
      .insert(commentToInsert)
      .select(\`
        id,
        post_id,
        user_id,
        comment_text,
        parent_comment_id,
        created_at,
        updated_at,
        user:users (name, "avatarUrl")
      \`)
      .single();

    if (insertError) {
      console.error(\`[API /api/user-posts/\${postId}/comments POST] Supabase error inserting comment:\`, insertError);
      return NextResponse.json({ message: 'Failed to post comment.', rawSupabaseError: insertError }, { status: 500 });
    }
    if (!insertedComment) {
      console.error(\`[API /api/user-posts/\${postId}/comments POST] Insert succeeded but no data returned for comment on post \${postId}.\`);
      return NextResponse.json({ message: 'Failed to create comment, no data returned.'}, {status: 500});
    }

    const responseComment: PostComment = {
        id: insertedComment.id,
        post_id: insertedComment.post_id,
        user_id: insertedComment.user_id,
        user_name: insertedComment.user?.name || 'Anonymous',
        user_avatar_url: insertedComment.user?.avatarUrl,
        comment_text: insertedComment.comment_text,
        parent_comment_id: insertedComment.parent_comment_id,
        created_at: insertedComment.created_at,
        updated_at: insertedComment.updated_at,
    };

    console.log(\`[API /api/user-posts/\${postId}/comments POST] Comment posted successfully by \${userId}.\`);
    return NextResponse.json(responseComment, { status: 201 });
  } catch (e: any) {
    console.error(\`[API /api/user-posts/\${postId}/comments POST] Unhandled error:\`, e);
    return NextResponse.json({ message: 'Server error posting comment.', errorDetails: e.message }, { status: 500 });
  }
}
