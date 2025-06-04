
// /src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient'; // Correct path
import type { User as AuthUserType } from '@/types';

export const dynamic = 'force-dynamic';

// GET all users (Admin)
export async function GET(request: NextRequest) {
  console.log("[API /api/admin/users GET] Request received.");

  if (!supabaseAdmin) {
    console.error('[API /api/admin/users GET] Supabase ADMIN client is not initialized. Check SUPABASE_SERVICE_ROLE_KEY and server restart.');
    return NextResponse.json({ message: 'Admin database service not available. Cannot fetch users.', rawSupabaseError: { message: 'Supabase ADMIN client not initialized.'} }, { status: 503 });
  }

  try {
    // Ensure all fields needed by AuthUserType are selected, and map Supabase's snake_case to camelCase if needed.
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, avatar_url, bio, roles, wishlist, bookmarked_post_ids, created_at, updated_at') // Select all relevant fields
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API /api/admin/users GET] Supabase error fetching users:', error);
      return NextResponse.json({
        message: 'Failed to fetch users for admin panel.',
        rawSupabaseError: { message: error.message, details: error.details, hint: error.hint, code: error.code }
      }, { status: 500 });
    }

    const users: AuthUserType[] = (data || []).map((userFromDb: any) => ({
      id: userFromDb.id,
      email: userFromDb.email,
      name: userFromDb.name,
      avatarUrl: userFromDb.avatar_url, // Mapping snake_case to camelCase
      bio: userFromDb.bio,
      roles: userFromDb.roles || ['customer'], // Default role
      wishlist: userFromDb.wishlist || [],
      bookmarked_post_ids: userFromDb.bookmarked_post_ids || [],
      createdAt: userFromDb.created_at,
      updatedAt: userFromDb.updated_at,
    }));

    console.log(`[API /api/admin/users GET] Successfully fetched ${users.length} users.`);
    return NextResponse.json(users);
  } catch (e: any) {
    console.error('[API /api/admin/users GET] Unhandled error:', e);
    return NextResponse.json({ message: 'Server error fetching users for admin.', errorDetails: e.message }, { status: 500 });
  }
}

    