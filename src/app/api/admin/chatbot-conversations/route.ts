
// /src/app/api/admin/chatbot-conversations/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient'; // Use admin client for direct insert

export const dynamic = 'force-dynamic';

interface SaveConversationPayload {
  adminUserId: string;
  userQuery: string;
  aiResponse: string;
  flowName?: string;
}

export async function POST(request: NextRequest) {
  console.log("[API /api/admin/chatbot-conversations POST] Request received.");

  if (!supabaseAdmin) {
    console.error('[API /api/admin/chatbot-conversations POST] Supabase ADMIN client is not initialized. Check SUPABASE_SERVICE_ROLE_KEY.');
    return NextResponse.json({ message: 'Database admin service not available.' }, { status: 503 });
  }

  let payload: SaveConversationPayload;
  try {
    payload = await request.json();
  } catch (error) {
    console.error('[API /api/admin/chatbot-conversations POST] Invalid JSON payload:', error);
    return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 });
  }

  const { adminUserId, userQuery, aiResponse, flowName = 'aiChatbotConciergeFlow' } = payload;

  if (!adminUserId || !userQuery || !aiResponse) {
    console.warn('[API /api/admin/chatbot-conversations POST] Missing required fields: adminUserId, userQuery, or aiResponse.');
    return NextResponse.json({ message: 'Admin User ID, User Query, and AI Response are required.' }, { status: 400 });
  }

  const conversationToInsert = {
    admin_user_id: adminUserId,
    user_query: userQuery,
    ai_response: aiResponse,
    flow_name: flowName,
    // timestamp is handled by DB default
  };

  console.log('[API /api/admin/chatbot-conversations POST] Attempting to insert conversation:', conversationToInsert);

  try {
    const { data, error: insertError } = await supabaseAdmin
      .from('admin_chatbot_conversations')
      .insert(conversationToInsert)
      .select()
      .single();

    if (insertError) {
      console.error('[API /api/admin/chatbot-conversations POST] Supabase error inserting conversation:', insertError);
      return NextResponse.json({
        message: 'Failed to save conversation to database.',
        rawSupabaseError: { message: insertError.message, details: insertError.details, hint: insertError.hint, code: insertError.code }
      }, { status: 500 });
    }

    console.log('[API /api/admin/chatbot-conversations POST] Admin chatbot conversation saved successfully, ID:', data?.id);
    return NextResponse.json({ message: 'Admin conversation saved successfully.', conversationId: data?.id }, { status: 201 });

  } catch (e: any) {
    console.error('[API /api/admin/chatbot-conversations POST] Unhandled error:', e);
    return NextResponse.json({ message: 'Server error saving admin conversation.', errorDetails: e.message }, { status: 500 });
  }
}
