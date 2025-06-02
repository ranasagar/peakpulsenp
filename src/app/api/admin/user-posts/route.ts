
// /src/app/api/admin/user-posts/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient'; 
import type { UserPost } from '@/types';

export const dynamic = 'force-dynamic';

// GET all user posts for admin panel
export async function GET(request: NextRequest) {
  console.log("[API /api/admin/user-posts GET] Request received.");

  if (!supabaseAdmin) {
    console.error('[API /api/admin/user-posts GET] Supabase ADMIN client is not initialized. Check SUPABASE_SERVICE_ROLE_KEY and server restart.');
    return NextResponse.json({
      message: 'Admin database service not available. Cannot fetch user posts.',
      rawSupabaseError: { message: 'Supabase ADMIN client not initialized.' }
    }, { status: 503 });
  }

  try {
    const { data, error } = await supabaseAdmin
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API /api/admin/user-posts GET] Supabase error fetching all user posts:', error);
      return NextResponse.json({
        message: 'Failed to fetch user posts for admin.',
        rawSupabaseError: error
      }, { status: 500 });
    }
    
    const posts: UserPost[] = (data || []).map((post: any) => ({
        id: post.id,
        user_id: post.user_id,
        user_name: post.user?.name || 'Unknown User', 
        user_avatar_url: post.user?.avatarUrl || undefined,
        image_url: post.image_url,
        caption: post.caption,
        product_tags: post.product_tags,
        status: post.status as UserPost['status'],
        created_at: post.created_at,
        updated_at: post.updated_at,
    }));


    console.log(`[API /api/admin/user-posts GET] Successfully fetched ${posts.length} user posts for admin.`);
    return NextResponse.json(posts);
  } catch (e) {
    const error = e as Error;
    console.error('[API /api/admin/user-posts GET] Unhandled error:', error);
    return NextResponse.json({ message: 'Server error fetching user posts for admin.', errorName: error.name, errorMessage: error.message }, { status: 500 });
  }
}

    