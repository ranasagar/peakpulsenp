
// /src/app/api/user-posts/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabaseClient.ts'; // Using relative path
import type { UserPost } from '@/types';

export const dynamic = 'force-dynamic';

// GET approved user posts
export async function GET(request: NextRequest) {
  console.log("[API /api/user-posts] GET request received for approved posts.");
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
          avatarUrl
        )
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API /api/user-posts] Supabase error fetching approved posts:', error);
      return NextResponse.json({ message: 'Failed to fetch user posts from database.', error: error.message, details: error.details, hint: error.hint }, { status: 500 });
    }
    
    const posts: UserPost[] = data?.map(post => ({
        id: post.id,
        user_id: post.user_id,
        // @ts-ignore supabase types might not be perfect for nested select
        user_name: post.users?.name || 'Peak Pulse User', 
        // @ts-ignore
        user_avatar_url: post.users?.avatarUrl,
        image_url: post.image_url,
        caption: post.caption,
        product_tags: post.product_tags,
        status: post.status as UserPost['status'],
        created_at: post.created_at,
        updated_at: post.updated_at,
    })) || [];


    console.log(`[API /api/user-posts] Successfully fetched ${posts.length} approved posts.`);
    return NextResponse.json(posts);
  } catch (error) {
    console.error('[API /api/user-posts] Unhandled error fetching approved posts:', error);
    return NextResponse.json({ message: 'Error fetching approved posts', error: (error as Error).message }, { status: 500 });
  }
}

// POST to create a new user post
interface CreateUserPostPayload {
  userId: string;
  imageUrl: string;
  caption?: string;
  productTags?: string[];
}
export async function POST(request: NextRequest) {
  console.log("[API /api/user-posts] POST request received to create user post.");
  try {
    const { userId, imageUrl, caption, productTags } = (await request.json()) as CreateUserPostPayload;

    if (!userId || !imageUrl) {
      return NextResponse.json({ message: 'User ID and Image URL are required.' }, { status: 400 });
    }

    const newPostData = {
      user_id: userId,
      image_url: imageUrl,
      caption: caption || null,
      product_tags: productTags || null,
      status: 'pending', // New posts default to pending
    };

    const { data, error } = await supabase
      .from('user_posts')
      .insert(newPostData)
      .select()
      .single();

    if (error) {
      console.error('[API /api/user-posts] Supabase error creating post:', error);
      return NextResponse.json({ message: 'Failed to create post in database.', error: error.message, details: error.details, hint: error.hint }, { status: 500 });
    }

    console.log('[API /api/user-posts] User post created successfully:', data);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[API /api/user-posts] Unhandled error creating user post:', error);
    return NextResponse.json({ message: 'Error creating user post', error: (error as Error).message }, { status: 500 });
  }
}
