
// /src/app/api/admin/user-posts/[postId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseClient';
import type { UserPost } from '@/types';

export const dynamic = 'force-dynamic';

interface UpdateUserPostPayload {
  status?: UserPost['status'];
  caption?: string;
}

// PUT to update a user post (e.g., change status)
export async function PUT(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  const { postId } = params;
  console.log(`[API /api/admin/user-posts/${postId} PUT] Request received.`);

  if (!supabaseAdmin) {
    console.error(`[API /api/admin/user-posts/${postId} PUT] Supabase ADMIN client not initialized.`);
    return NextResponse.json({ message: 'Admin database service not available.' }, { status: 503 });
  }
  if (!postId) {
    return NextResponse.json({ message: 'Post ID is required.' }, { status: 400 });
  }

  let payload: UpdateUserPostPayload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 });
  }
  
  console.log(`[API /api/admin/user-posts/${postId} PUT] Payload:`, payload);

  const { status, caption } = payload;
  const dataToUpdate: Partial<Pick<UserPost, 'status' | 'caption'>> = {};

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    dataToUpdate.status = status;
  }
  if (caption !== undefined) { 
    dataToUpdate.caption = caption;
  }

  if (Object.keys(dataToUpdate).length === 0) {
    return NextResponse.json({ message: 'No valid fields to update provided.' }, { status: 400 });
  }
  // Supabase trigger handles updated_at

  try {
    const { data, error } = await supabaseAdmin
      .from('user_posts')
      .update(dataToUpdate)
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      console.error(`[API /api/admin/user-posts/${postId} PUT] Supabase error updating post:`, error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Post not found.', rawSupabaseError: error }, { status: 404 });
      }
      return NextResponse.json({ message: 'Failed to update post status.', rawSupabaseError: error }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ message: 'Post not found after update attempt.' }, { status: 404 });
    }
    console.log(`[API /api/admin/user-posts/${postId} PUT] Post updated successfully.`);
    return NextResponse.json(data);
  } catch (e) {
    const error = e as Error;
    console.error(`[API /api/admin/user-posts/${postId} PUT] Unhandled error:`, error);
    return NextResponse.json({ message: 'Server error updating post.', errorName: error.name, errorMessage: error.message }, { status: 500 });
  }
}

// DELETE a user post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  const { postId } = params;
  console.log(`[API /api/admin/user-posts/${postId} DELETE] Request received.`);

  if (!supabaseAdmin) {
    console.error(`[API /api/admin/user-posts/${postId} DELETE] Supabase ADMIN client not initialized.`);
    return NextResponse.json({ message: 'Admin database service not available.' }, { status: 503 });
  }
  if (!postId) {
    return NextResponse.json({ message: 'Post ID is required.' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin
      .from('user_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error(`[API /api/admin/user-posts/${postId} DELETE] Supabase error deleting post:`, error);
      return NextResponse.json({ message: 'Failed to delete post.', rawSupabaseError: error }, { status: 500 });
    }
    console.log(`[API /api/admin/user-posts/${postId} DELETE] Post deleted successfully.`);
    return NextResponse.json({ message: 'Post deleted successfully.' }, { status: 200 });
  } catch (e) {
    const error = e as Error;
    console.error(`[API /api/admin/user-posts/${postId} DELETE] Unhandled error:`, error);
    return NextResponse.json({ message: 'Server error deleting post.', errorName: error.name, errorMessage: error.message }, { status: 500 });
  }
}

    